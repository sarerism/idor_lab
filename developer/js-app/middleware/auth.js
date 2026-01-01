/**
 * Authentication middleware for session-based login
 */

// Simple session storage (in-memory)
const sessions = new Map();

// Credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'cDjv8kFq67C1D1Yuhn8';

// Generate simple session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    // Skip auth for login/logout pages
    if (req.path === '/login' || req.path === '/logout' || req.path === '/api/login') {
        return next();
    }

    // Skip auth for vulnerable endpoint - training vulnerability
    if (req.path.includes('/prognose/prognoseVerbauratenBerechnung')) {
        return next();
    }

    const sessionId = req.cookies.sessionId;
    
    if (sessionId && sessions.has(sessionId)) {
        req.user = sessions.get(sessionId);
        return next();
    }
    
    // For API calls, return JSON error
    if (req.path.startsWith('/api/') || req.path.startsWith('/wkt/') || 
        req.path.startsWith('/esb/') || req.path.startsWith('/prognose/') ||
        req.path.startsWith('/dims') || req.path.startsWith('/teilanlage')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Please login first' });
    }
    
    // For page requests, redirect to login
    res.redirect('/login');
};

// Login handler
const handleLogin = (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionId = generateSessionId();
        sessions.set(sessionId, { username, loginTime: new Date() });
        
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax'
        });
        
        return res.status(200).json({ success: true, message: 'Login successful' });
    }
    
    res.status(401).json({ success: false, message: 'Invalid username or password' });
};

// Logout handler
const handleLogout = (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
        sessions.delete(sessionId);
        res.clearCookie('sessionId');
    }
    res.redirect('/login');
};

module.exports = { requireAuth, handleLogin, handleLogout };
