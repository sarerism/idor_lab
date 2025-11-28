FROM mysql:8.0

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=employee_portal
ENV MYSQL_USER=portal_user
ENV MYSQL_PASSWORD=portal_pass

# Copy init script
COPY init.sql /docker-entrypoint-initdb.d/

# Expose MySQL port
EXPOSE 3306
