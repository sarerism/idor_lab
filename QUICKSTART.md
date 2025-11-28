# MBTI IDOR Lab - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Configure Hosts File

**Linux/macOS:**
```bash
sudo nano /etc/hosts
```

**Windows:**
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

**Add these lines:**
```
127.0.0.1 localhost
127.0.0.1 portal.localhost
127.0.0.1 dev.localhost
```

### Step 2: Start the Lab
```bash
docker-compose up -d
```

### Step 3: Begin the Challenge

1. **Navigate to:** `http://localhost`
2. **Find credentials:** Look for the "View Default Access Credentials" link
3. **Discover the portal:** Use subdomain enumeration (ffuf, gobuster, or manual testing)
4. **Brute force Employee ID:** Format is `MBTI2024XXX`
5. **Exploit IDOR:** Access restricted reports via `report_id` parameter

---

## 🎯 Quick Attack Path

```
Landing Page → Default Creds → Subdomain Discovery → Brute Force → IDOR Exploitation
```

### Credentials You'll Find:
- **Default Password:** `tekelomuxo`
- **Employee ID Format:** `MBTI2024XXX` (needs brute force)
- **Valid Account:** `MBTI2024837` (must be discovered)

### Target:
- **Report #502:** Contains confidential infrastructure credentials

---

## 🔍 Enumeration Commands

### Subdomain Discovery:
```bash
# Using ffuf
ffuf -u http://FUZZ.localhost -w /path/to/wordlist.txt -fc 404

# Using gobuster
gobuster vhost -u http://localhost -w /path/to/wordlist.txt

# Manual testing
curl -H "Host: portal.localhost" http://localhost
```

### Employee ID Brute Force:
```bash
# Format: MBTI2024001 - MBTI2024999
# Password: tekelomuxo
```

---

## 📋 Verification Checklist

- [ ] Hosts file configured
- [ ] Containers running (`docker-compose ps`)
- [ ] Landing page accessible (`http://localhost`)
- [ ] Portal subdomain discoverable (`http://portal.localhost`)
- [ ] Login page visible
- [ ] Employee ID brute force successful
- [ ] Dashboard accessible
- [ ] Reports page IDOR exploitable

---

## ⚠️ Troubleshooting

**Can't access portal.localhost:**
- Check hosts file configuration
- Clear browser cache
- Try incognito mode
- Restart Docker containers

**Containers won't start:**
```bash
docker-compose down
docker-compose up -d
docker-compose logs
```

**Port 80 already in use:**
```bash
# Linux
sudo lsof -i :80
sudo systemctl stop apache2

# macOS
sudo lsof -i :80

# Windows
netstat -ano | findstr :80
```

---

## 📖 Full Documentation

- **Detailed Attack Flow:** See [ATTACK_FLOW.md](ATTACK_FLOW.md)
- **Subdomain Setup:** See [SUBDOMAIN_SETUP.md](SUBDOMAIN_SETUP.md)
- **Complete Guide:** See [README.md](README.md)

---

## 🎓 Learning Objectives

✅ Subdomain enumeration
✅ Credential discovery
✅ Brute force attacks
✅ IDOR vulnerability exploitation
✅ Information gathering
✅ Parameter manipulation

---

**Happy Hacking! 🔐**

## 1️⃣ Deploy the Lab (30 seconds)

```bash
docker-compose up -d
```

## 2️⃣ Access the Application

Open your browser: **http://localhost/portal/login.php**

## 3️⃣ Login

- **Employee ID**: `MBTI2024837`
- **Password**: `tekelomuxo`

## 4️⃣ Start Testing

You're now logged in as a regular employee. Look for vulnerabilities! 

**Hints**:
- Check the URL after login
- What parameters do you see?
- Can you access other users' data?
- Try sequential numbers in parameters

## 5️⃣ Stop the Lab

```bash
docker-compose down
```

---

## 🎯 Your Mission

Find and exploit the IDOR vulnerabilities to:
1. Access other employees' dashboards
2. Read confidential reports you shouldn't have access to
3. Discover sensitive credentials hidden in the system

**Good luck!** 🔐
