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
    cron \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create developer user for privilege escalation training
RUN useradd -m -s /bin/bash developer && \
    echo 'developer:cD$j$v8kFq67C1D' | chpasswd

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

# Set working directory
WORKDIR /var/www/html

EXPOSE 80

# Start Apache in foreground
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]