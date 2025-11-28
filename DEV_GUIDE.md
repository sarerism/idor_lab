# MBTI IDOR Lab - Development Guide

## 🚀 Local Development (No Docker Rebuild Needed)

### Quick Start for Frontend Changes

When working on HTML/CSS/JS files, use the local PHP server instead of rebuilding Docker:

```bash
./start-local.sh
```

Then visit: **http://localhost:8080**

- ✅ **Instant changes** - Just refresh your browser
- ✅ **No Docker rebuild** - Saves time
- ✅ **Fast iteration** - Perfect for design work

### When to Use Docker

Use Docker when you need:
- Database functionality (MySQL)
- Subdomain routing (portal.localhost, dev.localhost)
- Full authentication testing
- Production-like environment

```bash
# Rebuild and restart Docker (only when needed)
sudo docker compose down
export DOCKER_BUILDKIT=0
sudo -E docker compose up -d --build
```

### Development Workflow

1. **Frontend Changes** (HTML/CSS/JS):
   ```bash
   ./start-local.sh
   # Edit files in www/
   # Refresh browser to see changes
   ```

2. **Backend/DB Changes** (PHP/MySQL):
   ```bash
   # Edit files in www/
   # Rebuild Docker to test
   sudo docker compose restart mbti_portal
   ```

3. **Ready to Deploy**:
   ```bash
   # Full rebuild with all changes
   sudo docker compose down
   export DOCKER_BUILDKIT=0
   sudo -E docker compose up -d --build
   ```

## 📋 Current Setup

- **Landing Page**: Modern animated design with scrollable sections
- **Subdomains**: portal.localhost, dev.localhost
- **Vulnerability**: IDOR on report_id parameter only
- **Default Credentials**: tekelomuxo (Employee ID: MBTI2024837)

## 🎯 Attack Flow

1. Land on http://localhost
2. Enumerate NFS shares → Mount `/var/nfs/internal` to access company documentation
3. Discover portal subdomain (portal.localhost)
4. Brute force Employee ID (MBTI2024XXX)
5. Access dashboard, exploit IDOR on report_id parameter
6. Target: Report #502 contains sensitive data
