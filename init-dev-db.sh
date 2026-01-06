#!/bin/bash
# This script ensures dev_environment database exists

echo "Checking for dev_environment database"

DB_EXISTS=$(docker exec mbti_db mysql -uroot -p'MB_R00t_P@ss_2024!' -e "SHOW DATABASES LIKE 'dev_environment';" 2>/dev/null | grep dev_environment)

if [ -z "$DB_EXISTS" ]; then
    echo "dev_environment database not found. Creating it"
    cat mysql/dev_db.sql | docker exec -i mbti_db mysql -uroot -p'MB_R00t_P@ss_2024!' 2>&1 | grep -v Warning
    echo "dev_environment database created!"
else
    echo "dev_environment database already exists!"
fi

# verify
echo ""
echo "Databases:"
docker exec mbti_db mysql -uroot -p'MB_R00t_P@ss_2024!' -e "SHOW DATABASES;" 2>&1 | grep -v Warning

echo ""
echo "Dev credentials count:"
docker exec mbti_db mysql -uroot -p'MB_R00t_P@ss_2024!' -e "SELECT COUNT(*) FROM dev_environment.dev_credentials;" 2>&1 | grep -v Warning
