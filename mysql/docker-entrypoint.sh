#!/bin/bash
set -e

# This custom entrypoint ensures dev_environment database exists
# even when using persistent volumes

echo "Starting MySQL with custom initialization..."

# Start MySQL in background using the original entrypoint
docker-entrypoint.sh mysqld &
MYSQL_PID=$!

# Wait for MySQL to be ready
echo "Waiting for MySQL to start..."
for i in {30..0}; do
    if mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &> /dev/null; then
        break
    fi
    echo "MySQL is unavailable - sleeping"
    sleep 1
done

if [ "$i" = 0 ]; then
    echo "MySQL failed to start"
    exit 1
fi

echo "MySQL is up - checking dev_environment database..."

# Check if dev_environment exists
DB_EXISTS=$(mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SHOW DATABASES LIKE 'dev_environment';" 2>/dev/null | grep dev_environment || true)

if [ -z "$DB_EXISTS" ]; then
    echo "Creating dev_environment database..."
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/02-dev_db.sql 2>&1 | grep -v "ERROR 1050" || true
    echo "✅ dev_environment database created!"
else
    echo "✅ dev_environment database already exists"
fi

# Keep MySQL running in foreground
wait $MYSQL_PID
