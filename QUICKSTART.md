# MBTI IDOR Lab - Quick Start Guide

## 1️⃣ Deploy the Lab (30 seconds)

```bash
docker-compose up -d
```

## 2️⃣ Access the Application

Open your browser: **http://localhost/portal/login.php**

## 3️⃣ Login

- **Employee ID**: `MBTI2024837`
- **Password**: `MBTI1337`

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
