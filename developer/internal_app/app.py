#!/usr/bin/env python3

from flask import Flask, request, render_template_string
import os
import socket
import psutil
from datetime import datetime
from PIL import Image
import pytesseract
import tempfile

app = Flask(__name__)

# Dashboard template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Internal Dev Tools</title>
    <style>
        /* Mercedes-Benz Typography */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Corpo S', 'Unity Sans TT', 'Segoe UI', sans-serif;
            background-color: #000000;
            color: #ffffff;
            padding: 40px;
        }
        h1, h2, .logo-text {
            font-family: 'Corporate A', 'Corpo A', serif;
            font-weight: normal;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #333;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        h1 { 
            font-weight: 300;
            font-size: 2.2em;
            letter-spacing: 1px;
        }
        .logo-text {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 1.2em;
        }
        .card {
            background: #111;
            border: 1px solid #333;
            padding: 30px;
            margin-bottom: 30px;
        }
        .card h2 {
            font-weight: 300;
            color: #ccc;
            margin-bottom: 25px;
            font-size: 1.4em;
            border-bottom: 1px solid #222;
            padding-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }
        .info-item {
            border-left: 2px solid #fff;
            padding-left: 15px;
        }
        .info-label {
            color: #888;
            font-size: 0.8em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 1.1em;
            font-weight: 400;
        }
        .search-box {
            width: 100%;
            padding: 15px;
            font-family: 'Corpo S', 'Unity Sans TT', sans-serif;
            font-size: 1em;
            border: 1px solid #444;
            background: #000;
            color: #fff;
            margin-bottom: 0;
        }
        .search-box:focus {
            outline: none;
            border-color: #fff;
        }
        button {
            background: #fff;
            color: #000;
            font-weight: bold;
            border: none;
            padding: 15px 30px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: background 0.3s;
        }
        button:hover {
            background: #ccc;
        }
        .warning {
            background: #222;
            color: #aaa;
            padding: 15px;
            font-size: 0.9em;
            margin-bottom: 30px;
            border-left: 2px solid #888;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            color: #444;
            font-size: 0.8em;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="/static/silver-logo.png" alt="Mercedes-Benz Logo" style="height: 60px;">
                <div class="logo-text">Mercedes-Benz</div>
            </div>
            <h1>Internal Dev Tools</h1>
        </div>
        
        <div class="warning">
            Authorized Personnel Only. System Access Monitored.
        </div>

        <div class="card">
            <h2>System Telemetry</h2>
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
                    <div class="info-label">CPU Load</div>
                    <div class="info-value">{{ cpu_usage }}%</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Memory</div>
                    <div class="info-value">{{ memory_usage }}%</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Compliance Document Scanner</h2>
            <p style="margin-bottom: 20px; color: #888; font-weight: 300;">
                Upload scanned physical documents for automated OCR and policy extraction.
            </p>
            <form action="/scanner/upload" method="post" enctype="multipart/form-data">
                <div style="display: flex; gap: 0;">
                    <input type="file" name="file" class="search-box" accept="image/*" required>
                    <button type="submit">Scan Document</button>
                </div>
            </form>
        </div>

        <div class="footer">
            &copy; 2024 Mercedes-Benz Group AG. Internal Use Only.
        </div>
    </div>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def dashboard():
    # Get system info
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except:
        ip_address = '127.0.0.1'
    server_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cpu_usage = psutil.cpu_percent(interval=0.1)
    memory_usage = psutil.virtual_memory().percent

    # Rendering the main template
    return render_template_string(
        DASHBOARD_TEMPLATE,
        hostname=hostname,
        ip_address=ip_address,
        server_time=server_time,
        cpu_usage=cpu_usage,
        memory_usage=memory_usage
    )


@app.route('/health')
def health():
    return {'status': 'running', 'version': '1.2.0'}


@app.route('/scanner/upload', methods=['POST'])
def upload_compliance_doc():
    if 'file' not in request.files:
        return "No file uploaded", 400
    
    file = request.files['file']
    if file.filename == '':
        return "No file selected", 400

    # Save temp and process
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp:
            file.save(temp.name)
            temp_path = temp.name

        # 1. OCR the image
        # Note: We rely on the natural "noise" of OCR to make this challenge realistic.
        # Clean images with clear fonts work best.
        ocr_text = pytesseract.image_to_string(Image.open(temp_path))
        
        # Cleanup temp file
        os.unlink(temp_path)

        # 2. VULNERABLE SINK: Direct concatenation into template
        # Replicating the behavior where the system trusts the text extracted from the image.
        
        # We define a "Scanner Result" template that extends the main style but injects the text UNSAFELY.
        result_page = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Scan Results</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
                body { 
                    font-family: 'Roboto', sans-serif;
                    background: #000;
                    color: #fff;
                    padding: 40px;
                    text-align: center;
                }
                .result-box {
                    background: #111;
                    border: 1px solid #333;
                    padding: 30px;
                    display: inline-block;
                    text-align: left;
                    max-width: 800px;
                    width: 100%;
                }
                h2 { 
                    font-weight: 300;
                    color: #ccc;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #222;
                    padding-bottom: 15px; 
                }
                .extracted-content {
                    background: #000;
                    border: 1px solid #333;
                    padding: 15px;
                    font-family: 'Courier New', monospace;
                    margin-top: 20px;
                    white-space: pre-wrap;
                }
                .btn {
                    display: inline-block;
                    margin-top: 30px;
                    background: #fff;
                    color: #000;
                    padding: 15px 30px;
                    text-decoration: none;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .btn:hover { background: #ccc; }
            </style>
        </head>
        <body>
            <div class="result-box">
                <h2>Scan Complete</h2>
                <p>The following text was successfully extracted from your document:</p>
                <div class="extracted-content">
                    """ + ocr_text + """
                </div>
            </div>
            <br>
            <a href="/" class="btn">Return to Dashboard</a>
        </body>
        </html>
        """
        
        return render_template_string(result_page)
        
    except Exception as e:
        return f"Error processing document: {str(e)}", 500

if __name__ == '__main__':
    # Bind to 0.0.0.0 to allow access via Docker port forwarding
    app.run(host='0.0.0.0', port=5000, debug=False)
