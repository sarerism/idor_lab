#!/bin/bash

# Local Development Server for IDOR Lab
# This script starts a PHP development server without needing Docker

echo "🚀 Starting MBTI IDOR Lab - Local Development Mode"
echo "=================================================="
echo ""
echo "📁 Working directory: $(pwd)/www"
echo "🌐 Server will be available at:"
echo "   - http://localhost:8080 (Main site)"
echo "   - http://localhost:8080/portal (Portal - will need subdomain setup)"
echo ""
echo "⚠️  Note: This is for frontend testing only."
echo "   For full functionality (DB, subdomains), use Docker."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd www && php -S localhost:8080 router.php
