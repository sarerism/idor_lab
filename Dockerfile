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

# Create flags
RUN mkdir -p /home/www-data && \
    echo "MBTI{3mpl0y33_p0rt4l_4cc3ss_gr4nt3d}" > /home/www-data/user.txt && \
    chmod 600 /home/www-data/user.txt && \
    chown www-data:www-data /home/www-data/user.txt

RUN echo "MBTI{r00t_4cc3ss_m3rc3d3s_b3nz_syst3m}" > /root/root.txt && \
    chmod 600 /root/root.txt

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sudo \
    nano \
    cron \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install sudo rule for privilege escalation
RUN echo "www-data ALL=(ALL) NOPASSWD: /usr/bin/nano" >> /etc/sudoers

# Copy application files into the image
COPY www/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Set working directory
WORKDIR /var/www/html

EXPOSE 80

# Start Apache in foreground
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
