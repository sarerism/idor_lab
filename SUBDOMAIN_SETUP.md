# Subdomain Configuration Guide

## Local Hosts File Configuration

To access the lab via subdomains (portal.localhost, dev.localhost), you need to configure your local hosts file.

### Linux/macOS

1. Edit the hosts file:
```bash
sudo nano /etc/hosts
```

2. Add these entries:
```
127.0.0.1 localhost
127.0.0.1 portal.localhost
127.0.0.1 dev.localhost
```

3. Save and exit (Ctrl+X, Y, Enter)

4. Verify the changes:
```bash
ping portal.localhost
```

### Windows

1. Run Notepad as Administrator

2. Open file: `C:\Windows\System32\drivers\etc\hosts`

3. Add these entries:
```
127.0.0.1 localhost
127.0.0.1 portal.localhost
127.0.0.1 dev.localhost
```

4. Save the file

5. Flush DNS cache:
```powershell
ipconfig /flushdns
```

### Docker Desktop Users

If using Docker Desktop (Mac/Windows), the hosts file configuration above should work automatically.

### Testing Configuration

After configuration, test access:
```bash
# Main site
curl http://localhost

# Portal subdomain
curl http://portal.localhost

# Should redirect if not logged in
curl -I http://portal.localhost
```

### Troubleshooting

**Issue: Subdomain not resolving**
- Check hosts file syntax (no typos)
- Restart browser
- Clear browser DNS cache (chrome://net-internals/#dns)
- Ensure Docker containers are running

**Issue: "Connection refused"**
- Verify Docker containers are running: `docker-compose ps`
- Check port 80 is not in use: `sudo lsof -i :80`
- Restart containers: `docker-compose restart`

**Issue: Still seeing /portal instead of portal.localhost**
- Clear browser cache
- Try incognito/private window
- Access directly: `http://portal.localhost/login.php`

### Alternative: Using curl with Host Header

If you cannot modify hosts file:
```bash
curl -H "Host: portal.localhost" http://localhost
```

### Production Deployment

For production or cloud deployment:
1. Configure DNS records pointing to your server IP
2. Update Apache virtual hosts with actual domain names
3. Configure SSL/TLS certificates
4. Update application URLs in database/config files

---

## Why Subdomains?

Using subdomains makes the lab more realistic:
- ✅ Simulates real-world infrastructure
- ✅ Requires subdomain enumeration practice
- ✅ Separates different application components
- ✅ Better for learning security concepts
- ✅ Prepares for real penetration testing scenarios

---

## Enumeration Practice

Once configured, practice discovering subdomains:

### Using ffuf
```bash
ffuf -u http://FUZZ.localhost -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fc 404
```

### Using gobuster
```bash
gobuster vhost -u http://localhost -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

### Expected Results
```
portal.localhost - Employee Portal [200 OK]
dev.localhost - Development Environment [Future]
```
