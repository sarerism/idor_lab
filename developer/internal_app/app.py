#!/usr/bin/env python3

from flask import Flask, request, render_template_string
import os
import socket
import psutil
from datetime import datetime

app = Flask(__name__)

# Dashboard template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>MBTI Dev Tools Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #00447c 0%, #2d2926 100%);
            color: #fff;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
            text-align: center; 
            margin-bottom: 30px; 
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card h2 {
            color: #00d4ff;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .info-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00d4ff;
        }
        .info-label {
            color: #aaa;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #fff;
        }
        .search-box {
            width: 100%;
            padding: 15px;
            font-size: 1em;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            margin-bottom: 15px;
        }
        .search-box:focus {
            outline: none;
            border-color: #00d4ff;
        }
        .result {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
        }
        .warning {
            background: rgba(255, 200, 0, 0.2);
            border-left: 4px solid #ffc800;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            opacity: 0.7;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 MBTI Internal Dev Tools Dashboard</h1>
        
        <div class="warning">
            <strong>⚠️ Internal Use Only</strong><br>
            This dashboard is for authorized developers only. Access is restricted to localhost.
        </div>

        <div class="card">
            <h2>📊 System Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Hostname</div>
                    <div class="info-value">{{ hostname }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">IP Address</div>
                    <div class="info-value">{{ ip_address }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Server Time</div>
                    <div class="info-value">{{ server_time }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CPU Usage</div>
                    <div class="info-value">{{ cpu_usage }}%</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Memory Usage</div>
                    <div class="info-value">{{ memory_usage }}%</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🔍 Service Status Checker</h2>
            <p style="margin-bottom: 15px; opacity: 0.8;">
                Enter a service name to check its status (e.g., apache2, mysql, nginx)
            </p>
            <form method="POST">
                <input type="text" name="service_name" class="search-box" 
                       placeholder="Enter service name..." 
                       value="{{ service_name }}">
                <button type="submit" style="
                    width: 100%;
                    padding: 15px;
                    background: #00d4ff;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    font-size: 1em;
                    font-weight: bold;
                    cursor: pointer;
                ">Check Service Status</button>
            </form>
            
            {% if service_name %}
            <div class="result">
<strong>Service Query:</strong> {{ service_name }}
<strong>Status:</strong> {{ result }}
            </div>
            {% endif %}
        </div>

        <div class="footer">
            MBTI Developer Tools v1.2.0 | For Internal Use Only | Port 5000
        </div>
    </div>
</body>
</html>
"""


@app.route('/', methods=['GET', 'POST'])
def dashboard():
    service_name = ''
    result = ''

    # Get system info
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except:
        ip_address = '127.0.0.1'
    server_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cpu_usage = psutil.cpu_percent(interval=0.1)
    memory_usage = psutil.virtual_memory().percent

    if request.method == 'POST':
        service_name = request.form.get('service_name', '')

        if service_name:
            # User input directly concatenated into template string
            result_template = f"Checking service: {service_name}"
            result = render_template_string(result_template)
        else:
            result = "No service name provided"

    # Rendering the main template
    return render_template_string(
        DASHBOARD_TEMPLATE,
        hostname=hostname,
        ip_address=ip_address,
        server_time=server_time,
        cpu_usage=cpu_usage,
        memory_usage=memory_usage,
        service_name=service_name,
        result=result
    )


@app.route('/health')
def health():
    return {'status': 'running', 'version': '1.2.0'}


if __name__ == '__main__':
    # Bind to localhost only - requires port forwarding to access
    app.run(host='127.0.0.1', port=5000, debug=False)
