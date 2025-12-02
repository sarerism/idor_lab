# MBTI Employee Portal - IDOR Vulnerability Lab

A deliberately vulnerable web application designed for penetration testing training, featuring **Insecure Direct Object Reference (IDOR)** vulnerabilities.

## 🎯 Learning Objectives

- Understand and exploit IDOR vulnerabilities
- Practice parameter manipulation and fuzzing techniques
- Learn proper access control implementation
- Identify exposed sensitive data in web applications

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Basic understanding of web application security
- Hosts file access (for subdomain configuration)

### Setup

**Step 1: Configure Hosts File (Required)**

Add these entries to your hosts file:
```bash
# Linux/macOS: sudo nano /etc/hosts
# Windows: C:\Windows\System32\drivers\etc\hosts

127.0.0.1 localhost
127.0.0.1 portal.localhost
127.0.0.1 dev.localhost
```

See [SUBDOMAIN_SETUP.md](SUBDOMAIN_SETUP.md) for detailed instructions.

**Step 2: Deploy with Docker Compose**
```bash
docker-compose up -d
```

**Option 2: Manual Docker Commands**
```bash
# Pull images
docker pull sareer/mbti-employee-portal:latest
docker pull sareer/mbti-db:latest

# Create network
docker network create mbti_net

# Start database
docker run -d --name mbti_db --network mbti_net sareer/mbti-db:latest

# Wait 10 seconds for database initialization
sleep 10

# Start portal
docker run -d --name mbti_portal --network mbti_net -p 80:80 sareer/mbti-employee-portal:latest
```

### Access the Application
- Landing Page: `http://localhost`
- Portal Subdomain: `http://portal.localhost`
- Default Password (requires brute force to find Employee ID):
  - Password: `tekelomuxo`
  - Employee ID Format: `MBTI2024XXX` (must be discovered)
  - Valid Account: `MBTI2024837` (found via brute force)

## 🔍 Lab Details

### Technology Stack
- **Base Image**: Ubuntu 22.04 (207MB)
- **Web Server**: Apache 2.4
- **Backend**: PHP 8.1
- **Database**: MySQL 8.0 (pre-populated with 511 reports)

### Vulnerabilities

This lab contains intentional security vulnerabilities for educational purposes:

1. **Primary IDOR**: Report ID enumeration (report_id parameter)
2. **Information Disclosure**: Default credentials document on landing page
3. **Weak Authentication**: Default password with brute-forceable Employee ID
4. **Subdomain Enumeration**: Predictable subdomain structure
5. Additional misconfigurations for discovery

**Note**: Detailed exploitation steps are in [ATTACK_FLOW.md](ATTACK_FLOW.md). The intended attack path requires:
- Finding default credentials on landing page
- Discovering portal subdomain via enumeration
- Brute forcing Employee ID to login
- Exploiting IDOR on report_id parameter

## 📊 Lab Environment

### Database Contents
- **7 employees** across different departments and roles
  - Only MBTI2024837 has the default password (must be brute forced)
  - All other accounts have complex, unguessable passwords
- **511 weekly reports** (IDs 1-511)
  - Reports 1-500: Standard dummy data
  - Reports 501-511: Detailed realistic reports
  - **Report 502**: Contains CONFIDENTIAL infrastructure credentials (Target)

### User Roles
- Regular Employees
- Department Managers
- Different access levels for testing authorization bypasses

## 🛠️ Management Commands

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f mbti_portal
docker-compose logs -f mbti_db
```

### Stop Lab
```bash
docker-compose down
```

### Restart Lab
```bash
docker-compose restart
```

### Complete Cleanup
```bash
docker-compose down
docker rmi sareer/mbti-employee-portal:latest sareer/mbti-db:latest
```

## 🏗️ Building from Source

### Build Portal Image
```bash
docker build -t sareer/mbti-employee-portal:latest .
```

### Build Database Image
```bash
docker build -f Dockerfile.db -t sareer/mbti-db:latest .
```

## 📝 Lab Structure

```
mbti-idor-lab/
├── docker-compose.yml          # Orchestration configuration
├── Dockerfile                  # Web portal image
├── Dockerfile.db              # Database image
├── www/                       # Web application files
│   ├── index.html
│   ├── portal/
│   │   ├── login.php
│   │   ├── dashboard.php
│   │   ├── config.php
│   │   └── ...
│   └── css/, js/, images/
└── mysql/
    └── init.sql               # Database initialization
```

## ⚠️ Disclaimer

This application contains **intentional security vulnerabilities** for educational purposes only.

**WARNING**: 
- DO NOT deploy this application on public networks
- DO NOT use in production environments
- Only use in isolated lab environments
- This is for authorized penetration testing training only

## 🎓 Recommended Practice Flow

1. **Reconnaissance**: Explore the application as a normal user
2. **Parameter Analysis**: Identify user-controllable parameters
3. **Access Control Testing**: Test authorization mechanisms
4. **Data Enumeration**: Practice systematic information gathering
5. **Documentation**: Record findings as you would in a real pentest

## 📌 Tips for Learners

- Pay attention to URL parameters
- Test different user roles and permissions
- Look for patterns in sequential identifiers
- Practice both manual testing and automated fuzzing
- Document all findings with evidence (screenshots, requests/responses)

## 🐳 Docker Hub

Pre-built images are available on Docker Hub:
- Portal: `sareer/mbti-employee-portal:latest` (207MB)
- Database: `sareer/mbti-db:latest` (779MB)

## 📄 License

This project is intended for educational purposes only. Use responsibly and ethically.

## 🤝 Contributing

This is a training lab. If you find issues or have improvements, feel free to submit pull requests.

---

**Happy Hacking! 🔐**
