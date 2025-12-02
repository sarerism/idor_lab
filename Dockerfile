FROM ubuntu:22.04

# Set environment to non-interactive to avoid prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install Apache, PHP and required extensions
RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-cli \
    php8.1-common \
    php8.1-mysql \
    php8.1-mysqli \
    libapache2-mod-php8.1 \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod php8.1 rewrite

# Copy Apache virtual host configuration (React version)
COPY portal/apache-vhost.conf /etc/apache2/sites-available/000-default.conf

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sudo \
    nano \
    vim \
    python3 \
    python3-pip \
    cron \
    curl \
    wget \
    openssh-server \
    nfs-kernel-server \
    slapd \
    ldap-utils \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Install Python packages for internal dashboard
RUN pip3 install Flask==3.0.0 psutil==5.9.6

# Create users for privilege escalation training
RUN useradd -m -s /bin/bash developer && \
    echo 'developer:cDjv8kFq67C1D1Yuhn8' | chpasswd && \
    useradd -m -s /bin/bash peter.schneider && \
    echo 'peter.schneider:tekelomuxo' | chpasswd

# Set environment variables in developer's bashrc (only visible to developer)
RUN echo 'export DEV_USER=developer' >> /home/developer/.bashrc && \
    echo 'export DEV_PASS=cDjv8kFq67C1D1Yuhn8' >> /home/developer/.bashrc && \
    echo 'export INTERNAL_DASHBOARD_PORT=5000' >> /home/developer/.bashrc && \
    chown developer:developer /home/developer/.bashrc

# Copy system administration scripts
COPY scripts/manage_containers.py /usr/local/bin/manage_containers.py
COPY scripts/system_monitor.py /usr/local/bin/system_monitor.py
COPY scripts/log_rotation.py /usr/local/bin/log_rotation.py
RUN chmod 755 /usr/local/bin/manage_containers.py \
    /usr/local/bin/system_monitor.py \
    /usr/local/bin/log_rotation.py && \
    chown root:root /usr/local/bin/manage_containers.py \
    /usr/local/bin/system_monitor.py \
    /usr/local/bin/log_rotation.py

# Allow www-data to run scripts as developer user
RUN echo "www-data ALL=(developer) NOPASSWD: /usr/local/bin/log_rotation.py" >> /etc/sudoers && \
    echo "www-data ALL=(developer) NOPASSWD: /usr/local/bin/system_monitor.py" >> /etc/sudoers && \
    echo "www-data ALL=(developer) NOPASSWD: /usr/local/bin/manage_containers.py" >> /etc/sudoers

# Setup internal developer dashboard (SSTI vulnerability for privesc)
# Make it only accessible to developer user - www-data cannot read or execute
COPY developer/internal_app/ /home/developer/internal_app/
RUN chown -R developer:developer /home/developer/internal_app && \
    chmod 700 /home/developer/internal_app && \
    chmod 600 /home/developer/internal_app/app.py && \
    chmod 600 /home/developer/internal_app/requirements.txt

# Create a startup script that developer can run (owned by developer, executable by developer only)
RUN echo '#!/bin/bash\n/usr/bin/python3 /home/developer/internal_app/app.py' > /home/developer/start_dashboard.sh && \
    chown developer:developer /home/developer/start_dashboard.sh && \
    chmod 700 /home/developer/start_dashboard.sh

# Create a cron job that runs as developer to start the dashboard on boot
RUN echo '@reboot developer /home/developer/start_dashboard.sh > /dev/null 2>&1 &' >> /etc/crontab

# Copy application files into the image
COPY www/ /var/www/html/
COPY portal/ /var/www/portal/

# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    chown -R www-data:www-data /var/www/portal && \
    chmod -R 755 /var/www/portal

# Setup NFS share with internal directory containing HTML guides
COPY internal/ /var/nfs/internal/
RUN chmod 755 /var/nfs/internal && \
    chmod 644 /var/nfs/internal/*.html && \
    echo "/var/nfs/internal *(ro,sync,no_subtree_check,no_root_squash,fsid=0)" >> /etc/exports

# Configure NFS and start services
RUN mkdir -p /var/lib/nfs/rpc_pipefs && \
    echo "rpcbind : ALL" >> /etc/hosts.allow

# Configure LDAP
COPY ldap_init.ldif /tmp/ldap_init.ldif
COPY ldap_acl.ldif /tmp/ldap_acl.ldif
RUN mkdir -p /etc/ldap/slapd.d /var/lib/ldap && \
    chown -R openldap:openldap /etc/ldap/slapd.d /var/lib/ldap && \
    echo -e "slapd slapd/internal/generated_adminpw password admin\nslapd slapd/internal/adminpw password admin\nslapd slapd/password2 password admin\nslapd slapd/password1 password admin\nslapd slapd/dump_database_destdir string /var/backups/slapd-VERSION\nslapd slapd/domain string mbti.local\nslapd shared/organization string MBTI\nslapd slapd/backend string MDB\nslapd slapd/purge_database boolean true\nslapd slapd/move_old_database boolean true\nslapd slapd/allow_ldap_v2 boolean false\nslapd slapd/no_configuration boolean false\nslapd slapd/dump_database select when needed" | debconf-set-selections && \
    dpkg-reconfigure -f noninteractive slapd

# Set working directory
WORKDIR /var/www/html

EXPOSE 80 389 2049 111 22

# Start script for Apache, NFS, LDAP, SSH (Dashboard will be started by cron as developer)
RUN echo '#!/bin/bash\n\
    /usr/sbin/rpcbind\n\
    /usr/sbin/rpc.nfsd 8\n\
    /usr/sbin/rpc.mountd\n\
    exportfs -ra\n\
    service slapd start\n\
    service ssh start\n\
    service cron start\n\
    sleep 3\n\
    tail -n +7 /tmp/ldap_init.ldif | ldapadd -x -D "cn=admin,dc=mbti,dc=local" -w admin 2>/dev/null || true\n\
    ldapmodify -Q -Y EXTERNAL -H ldapi:/// -f /tmp/ldap_acl.ldif 2>/dev/null || true\n\
    su - developer -c "/home/developer/start_dashboard.sh &"\n\
    exec /usr/sbin/apache2ctl -D FOREGROUND' > /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]