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

echo "MySQL is up - initializing dev_environment database..."

# Always recreate dev_environment to ensure fresh data on every startup
echo "Dropping and recreating dev_environment database..."
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS dev_environment;" 2>/dev/null || true
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/02-dev_db.sql 2>&1 | grep -v "Using a password" || true
echo "✅ dev_environment database initialized!"

# Keep MySQL running in foreground
wait $MYSQL_PID
