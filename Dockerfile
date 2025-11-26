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

# Copy Apache virtual host configuration
COPY www/apache-vhosts.conf /etc/apache2/sites-available/000-default.conf

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sudo \
    nano \
    vim \
    python3 \
    cron \
    curl \
    wget \
    nfs-kernel-server \
    slapd \
    ldap-utils \
    && rm -rf /var/lib/apt/lists/*

# Create users for privilege escalation training
RUN useradd -m -s /bin/bash developer && \
    echo 'developer:cD$j$v8kFq67C1D' | chpasswd && \
    useradd -m -s /bin/bash john.doe && \
    echo 'john.doe:tekelomuxo' | chpasswd

# Copy privilege escalation script
COPY manage_containers.py /usr/local/bin/manage_containers.py
RUN chmod 755 /usr/local/bin/manage_containers.py && \
    chown root:root /usr/local/bin/manage_containers.py

# Allow www-data to run the script as developer user
RUN echo "www-data ALL=(developer) NOPASSWD: /usr/local/bin/manage_containers.py" >> /etc/sudoers

# Copy application files into the image
COPY www/ /var/www/html/
COPY portal/ /var/www/portal/

# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    chown -R www-data:www-data /var/www/portal && \
    chmod -R 755 /var/www/portal

# Setup NFS share for portal guide
RUN mkdir -p /var/nfs/portal-docs && \
    mv /var/www/html/guides/portal-guide.html /var/nfs/portal-docs/ && \
    chmod 755 /var/nfs/portal-docs && \
    chmod 644 /var/nfs/portal-docs/portal-guide.html && \
    echo "/var/nfs/portal-docs *(ro,sync,no_subtree_check,no_root_squash,fsid=0)" >> /etc/exports

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

EXPOSE 80 389 2049 111

# Start script for Apache, NFS, and LDAP
RUN echo '#!/bin/bash\n\
    /usr/sbin/rpcbind\n\
    /usr/sbin/rpc.nfsd 8\n\
    /usr/sbin/rpc.mountd\n\
    exportfs -ra\n\
    service slapd start\n\
    sleep 3\n\
    tail -n +7 /tmp/ldap_init.ldif | ldapadd -x -D "cn=admin,dc=mbti,dc=local" -w admin 2>/dev/null || true\n\
    ldapmodify -Q -Y EXTERNAL -H ldapi:/// -f /tmp/ldap_acl.ldif 2>/dev/null || true\n\
    exec /usr/sbin/apache2ctl -D FOREGROUND' > /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]