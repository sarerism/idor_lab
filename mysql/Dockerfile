FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=employee_portal
ENV MYSQL_USER=portal_user
ENV MYSQL_PASSWORD=portal_pass

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
