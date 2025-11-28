<?php
session_start();

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.php');
    exit();
}

// Include database connection for all pages
require_once 'config.php';

// FIXED: Removed UID-based IDOR vulnerability
// The uid parameter is now only used for display purposes and validated against session
$uid = $_GET['uid'] ?? null;
$report_id = $_GET['report_id'] ?? null;

// SECURITY: Always use session data, uid parameter must match logged-in user
$employee_id = $_SESSION['employee_id'] ?? 'Unknown';
$full_name = $_SESSION['full_name'] ?? 'Employee';
$email = $_SESSION['email'] ?? '';
$department = $_SESSION['department'] ?? '';
$role = $_SESSION['role'] ?? '';
$is_manager_view = ($role === 'Department Manager' || $department === 'Management');

// Validate uid parameter matches session (prevent unauthorized access)
if ($uid !== null && $uid !== $employee_id) {
    // Attempted unauthorized access - redirect to own dashboard
    header('Location: dashboard.php?page=home&uid=' . $employee_id);
    exit();
}

// Handle password change
$password_message = '';
$password_error = '';
if (isset($_POST['change_password'])) {
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    if (empty($new_password) || empty($confirm_password)) {
        $password_error = 'Both password fields are required.';
    } elseif ($new_password !== $confirm_password) {
        $password_error = 'Passwords do not match. Please try again.';
    } elseif (strlen($new_password) < 6) {
        $password_error = 'Password must be at least 6 characters long.';
    } else {
        // Update password in database
        $employee_id = $_SESSION['employee_id'];
        $new_password_hash = md5($new_password);
        
        $stmt = $conn->prepare("UPDATE employees SET password_hash = ? WHERE employee_id = ?");
        $stmt->bind_param("ss", $new_password_hash, $employee_id);
        
        if ($stmt->execute()) {
            $password_message = 'Password changed successfully!';
        } else {
            $password_error = 'Failed to update password. Please try again.';
        }
        $stmt->close();
    }
}

// CRITICAL: Enforce UID parameter - must match session
// If uid is missing or doesn't match session, redirect with proper uid
$required_uid = $_SESSION['employee_id'] ?? null;
if (!$required_uid) {
    // No session, redirect to login
    header('Location: login.php');
    exit();
}

$provided_uid = $_GET['uid'] ?? null;
if (!$provided_uid || $provided_uid !== $required_uid) {
    // Missing or mismatched uid - redirect to proper URL with uid
    $page = $_GET['page'] ?? 'home';
    $report_id = $_GET['report_id'] ?? null;
    
    $redirect_url = 'dashboard.php?page=' . urlencode($page) . '&uid=' . urlencode($required_uid);
    if ($report_id) {
        $redirect_url .= '&report_id=' . urlencode($report_id);
    }
    header('Location: ' . $redirect_url);
    exit();
}

// VULNERABLE: Local File Inclusion (LFI) - Intentional for training
// Whitelist allowed pages to prevent unintended exposure
$allowed_pages = ['home', 'projects', 'tasks', 'timesheet', 'team', 'reports', 'profile', 'messages'];
$page = $_GET['page'] ?? 'home';

if (!in_array($page, $allowed_pages)) {
    // Invalid page, redirect to home
    header('Location: dashboard.php?page=home&uid=' . urlencode($required_uid));
    exit();
}

$employee_id = $_SESSION['employee_id'] ?? 'Unknown';
$full_name = $_SESSION['full_name'] ?? 'Employee';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MBTI Tech Innovation Portal - Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root[data-theme="dark"] {
            --mb-bg-primary: #0D0D0D;
            --mb-bg-secondary: #1A1A1A;
            --mb-bg-tertiary: #262626;
            --mb-text-primary: #FFFFFF;
            --mb-text-secondary: #CCCCCC;
            --mb-text-muted: #808080;
            --mb-accent-primary: #00ADEF;
            --mb-accent-silver: #C7C7C7;
            --mb-accent-glow: rgba(0, 173, 239, 0.2);
            --mb-border: rgba(199, 199, 199, 0.15);
            --mb-status-green: #00D084;
            --mb-status-yellow: #FFB800;
            --mb-status-red: #FF3B3B;
            --mb-gradient-primary: linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%);
            --mb-gradient-accent: linear-gradient(135deg, #00ADEF 0%, #0088CC 100%);
        }
        
        :root[data-theme="light"] {
            --mb-bg-primary: #FFFFFF;
            --mb-bg-secondary: #F5F5F5;
            --mb-bg-tertiary: #E8E8E8;
            --mb-text-primary: #0D0D0D;
            --mb-text-secondary: #333333;
            --mb-text-muted: #666666;
            --mb-accent-primary: #00ADEF;
            --mb-accent-silver: #8C8C8C;
            --mb-accent-glow: rgba(0, 173, 239, 0.15);
            --mb-border: rgba(0, 0, 0, 0.12);
            --mb-status-green: #00D084;
            --mb-status-yellow: #FFB800;
            --mb-status-red: #FF3B3B;
            --mb-gradient-primary: linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%);
            --mb-gradient-accent: linear-gradient(135deg, #00ADEF 0%, #0088CC 100%);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--mb-bg-primary);
            color: var(--mb-text-primary);
            display: flex;
            min-height: 100vh;
            transition: background 0.3s ease, color 0.3s ease;
            position: relative;
            overflow-x: hidden;
        }
        
        /* Tech Grid Background */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(var(--mb-border) 1px, transparent 1px),
                linear-gradient(90deg, var(--mb-border) 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: 0.3;
            pointer-events: none;
            z-index: 0;
        }
        
        /* Sidebar Navigation */
        .sidebar {
            width: 80px;
            background: var(--mb-bg-secondary);
            border-right: 1px solid var(--mb-border);
            position: fixed;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.5rem 0;
            z-index: 100;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
        }
        
        .sidebar:hover {
            width: 240px;
        }
        
        .sidebar-logo {
            width: 48px;
            height: 48px;
            margin-bottom: 3rem;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .sidebar:hover .sidebar-logo {
            width: 56px;
            height: 56px;
        }
        
        .nav-menu {
            list-style: none;
            width: 100%;
            padding: 0;
            flex: 1;
        }
        
        .nav-item {
            width: 100%;
            height: 56px;
            display: flex;
            align-items: center;
            padding: 0 1.5rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: var(--mb-text-secondary);
            text-decoration: none;
            position: relative;
            overflow: hidden;
        }
        
        .nav-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            height: 24px;
            width: 3px;
            background: var(--mb-gradient-accent);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .nav-icon {
            width: 24px;
            height: 24px;
            font-size: 1.3rem;
            flex-shrink: 0;
            transition: all 0.3s ease;
        }
        
        .nav-label {
            margin-left: 1rem;
            font-size: 0.9rem;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
            letter-spacing: 0.3px;
        }
        
        .sidebar:hover .nav-label {
            opacity: 1;
        }
        
        .nav-item:hover {
            background: var(--mb-bg-tertiary);
            color: var(--mb-text-primary);
        }
        
        .nav-item:hover .nav-icon {
            color: var(--mb-accent-primary);
            transform: scale(1.1);
        }
        
        .nav-item.active {
            color: var(--mb-accent-primary);
            background: var(--mb-accent-glow);
        }
        
        .nav-item.active::before {
            opacity: 1;
        }
        
        .nav-item.active .nav-icon {
            color: var(--mb-accent-primary);
        }
        
        .nav-separator {
            height: 1px;
            background: var(--mb-border);
            margin: 1.5rem 1rem;
        }
        
        /* Main Content */
        .main-content {
            margin-left: 80px;
            flex: 1;
            position: relative;
            z-index: 1;
            transition: margin-left 0.3s ease;
        }
        
        /* Top Header */
        .top-bar {
            background: var(--mb-bg-secondary);
            backdrop-filter: blur(20px);
            padding: 1rem 2.5rem;
            border-bottom: 1px solid var(--mb-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 50;
            height: 72px;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 2rem;
        }
        
        .page-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--mb-text-primary);
            letter-spacing: -0.5px;
        }
        
        .portal-badge {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--mb-accent-primary);
            background: var(--mb-accent-glow);
            padding: 0.4rem 0.9rem;
            border-radius: 6px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border: 1px solid var(--mb-accent-primary);
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        
        .theme-toggle {
            width: 48px;
            height: 48px;
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--mb-text-secondary);
        }
        
        .theme-toggle:hover {
            background: var(--mb-accent-glow);
            border-color: var(--mb-accent-primary);
            color: var(--mb-accent-primary);
            transform: rotate(180deg);
        }
        
        .user-badge {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--mb-bg-tertiary);
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: 1px solid var(--mb-border);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .user-badge:hover {
            border-color: var(--mb-accent-primary);
            box-shadow: 0 0 20px var(--mb-accent-glow);
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            background: var(--mb-gradient-accent);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
            font-family: 'Roboto Mono', monospace;
        }
        
        .user-info {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
        }
        
        .user-name {
            font-size: 0.9rem;
            color: var(--mb-text-primary);
            font-weight: 600;
        }
        
        .user-id {
            font-size: 0.75rem;
            color: var(--mb-text-muted);
            font-family: 'Roboto Mono', monospace;
        }
        
        /* Content Area */
        .content-area {
            padding: 2rem;
            max-width: 1800px;
            margin: 0 auto;
        }
        
        /* Dashboard Grid Layout */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .grid-left {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .grid-right {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #00adef, #667eea, #764ba2);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 173, 239, 0.2);
            border-color: rgba(0, 173, 239, 0.3);
        }
        
        .card:hover::before {
            opacity: 1;
        }
        
        .card-header {
            font-size: 1.3rem;
            font-weight: 700;
            color: white;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        
        .card-header::before {
            content: '';
            width: 4px;
            height: 24px;
            background: linear-gradient(135deg, #00adef, #667eea);
            border-radius: 2px;
        }
        
        .message-item, .assignment-item, .notice-item {
            padding: 1.2rem;
            margin-bottom: 1rem;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
        }
        
        .message-item:hover, .assignment-item:hover, .notice-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(0, 173, 239, 0.3);
            transform: translateX(5px);
        }
        
        .message-item:last-child, .assignment-item:last-child, .notice-item:last-child {
            margin-bottom: 0;
        }
        
        .item-title {
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
        
        .item-meta {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 0.5rem;
        }
        
        .item-content {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }
        
        .assignment-due {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 0.5rem;
        }
        
        .assignment-course {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .notice-posted {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 0.5rem;
        }
        
        .notice-author {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.4);
        }
        
        .view-all-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1rem;
            color: #00adef;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .view-all-link:hover {
            color: #667eea;
            transform: translateX(5px);
        }
        
        .view-all-link::after {
            content: '→';
            transition: transform 0.3s ease;
        }
        
        .view-all-link:hover::after {
            transform: translateX(3px);
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.35rem 0.8rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            margin-left: 0.5rem;
            letter-spacing: 0.3px;
        }
        
        .status-active {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2));
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .status-overdue {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2));
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        /* Flag Notice */
        .flag-card {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(102, 126, 234, 0.4);
            color: white;
            padding: 2rem;
        }
        
        .flag-card h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .flag-code {
            background: rgba(255,255,255,0.2);
            padding: 0.8rem 1.2rem;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            margin-top: 1rem;
            display: inline-block;
            backdrop-filter: blur(10px);
        }
        
        /* === SOPHISTICATED MODULE CARDS === */
        .module-card {
            background: var(--mb-bg-secondary);
            border: 1px solid var(--mb-border);
            border-radius: 16px;
            padding: 1.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .module-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--mb-gradient-accent);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .module-card:hover {
            border-color: var(--mb-accent-primary);
            box-shadow: 0 8px 32px var(--mb-accent-glow);
            transform: translateY(-2px);
        }
        
        .module-card:hover::before {
            opacity: 1;
        }
        
        .module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--mb-border);
        }
        
        .module-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--mb-text-primary);
            letter-spacing: -0.3px;
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }
        
        .module-title-icon {
            width: 20px;
            height: 20px;
            color: var(--mb-accent-primary);
        }
        
        .module-action {
            font-size: 0.8rem;
            color: var(--mb-accent-primary);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .module-action:hover {
            color: var(--mb-text-primary);
            text-decoration: underline;
        }
        
        /* === TEAM COLLABORATION HUB === */
        .team-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
            border-radius: 10px;
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            margin-bottom: 0.8rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .team-item:last-child {
            margin-bottom: 0;
        }
        
        .team-item:hover {
            border-color: var(--mb-accent-primary);
            background: var(--mb-accent-glow);
            transform: translateX(4px);
        }
        
        .team-status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 6px;
        }
        
        .status-resolved { background: var(--mb-status-green); box-shadow: 0 0 8px var(--mb-status-green); }
        .status-progress { background: var(--mb-accent-primary); box-shadow: 0 0 8px var(--mb-accent-primary); }
        .status-urgent { background: var(--mb-status-red); box-shadow: 0 0 8px var(--mb-status-red); animation: pulse 2s infinite; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .team-content {
            flex: 1;
        }
        
        .team-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--mb-text-primary);
            margin-bottom: 0.3rem;
        }
        
        .team-meta {
            font-size: 0.75rem;
            color: var(--mb-text-muted);
            font-family: 'Roboto Mono', monospace;
        }
        
        .team-badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 0.5rem;
        }
        
        .badge-security {
            background: rgba(255, 59, 59, 0.15);
            color: var(--mb-status-red);
            border: 1px solid rgba(255, 59, 59, 0.3);
        }
        
        .badge-review {
            background: rgba(0, 173, 239, 0.15);
            color: var(--mb-accent-primary);
            border: 1px solid rgba(0, 173, 239, 0.3);
        }
        
        .badge-update {
            background: rgba(255, 184, 0, 0.15);
            color: var(--mb-status-yellow);
            border: 1px solid rgba(255, 184, 0, 0.3);
        }
        
        /* === PERFORMANCE METRICS === */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        
        .metric-widget {
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            border-radius: 12px;
            padding: 1.2rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .metric-widget:hover {
            border-color: var(--mb-accent-primary);
            transform: scale(1.02);
        }
        
        .metric-widget::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 60px;
            height: 60px;
            background: var(--mb-gradient-accent);
            opacity: 0.05;
            border-radius: 0 12px 0 100%;
        }
        
        .metric-label {
            font-size: 0.75rem;
            color: var(--mb-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--mb-accent-primary);
            font-family: 'Roboto Mono', monospace;
            line-height: 1;
            margin-bottom: 0.5rem;
        }
        
        .metric-trend {
            font-size: 0.75rem;
            color: var(--mb-status-green);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        
        .metric-trend.negative {
            color: var(--mb-status-red);
        }
        
        .mini-chart {
            height: 40px;
            margin-top: 0.8rem;
            background: linear-gradient(180deg, var(--mb-accent-glow) 0%, transparent 100%);
            border-radius: 4px;
            position: relative;
            overflow: hidden;
        }
        
        .mini-chart::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--mb-accent-primary);
        }
        
        /* === PROJECT PORTFOLIO === */
        .project-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .project-card {
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            border-radius: 12px;
            padding: 1.2rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .project-card:hover {
            border-color: var(--mb-accent-primary);
            transform: translateX(4px);
            box-shadow: 0 4px 16px var(--mb-accent-glow);
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .project-name {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--mb-text-primary);
            margin-bottom: 0.3rem;
        }
        
        .project-status {
            font-size: 0.7rem;
            padding: 0.3rem 0.7rem;
            border-radius: 6px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-on-track {
            background: rgba(0, 208, 132, 0.15);
            color: var(--mb-status-green);
            border: 1px solid rgba(0, 208, 132, 0.3);
        }
        
        .status-at-risk {
            background: rgba(255, 184, 0, 0.15);
            color: var(--mb-status-yellow);
            border: 1px solid rgba(255, 184, 0, 0.3);
        }
        
        .project-meta {
            font-size: 0.75rem;
            color: var(--mb-text-muted);
            margin-bottom: 1rem;
            font-family: 'Roboto Mono', monospace;
        }
        
        .project-progress {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--mb-text-muted);
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--mb-bg-primary);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--mb-gradient-accent);
            border-radius: 3px;
            transition: width 1s ease;
            position: relative;
        }
        
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        /* === INNOVATION FEED === */
        .news-feed {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .news-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            border-left: 3px solid var(--mb-accent-primary);
            border-radius: 10px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .news-item:hover {
            background: var(--mb-accent-glow);
            border-left-width: 4px;
            transform: translateX(4px);
        }
        
        .news-icon {
            width: 40px;
            height: 40px;
            background: var(--mb-gradient-accent);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        
        .news-content {
            flex: 1;
        }
        
        .news-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--mb-text-primary);
            margin-bottom: 0.3rem;
        }
        
        .news-description {
            font-size: 0.8rem;
            color: var(--mb-text-secondary);
            line-height: 1.5;
            margin-bottom: 0.5rem;
        }
        
        .news-meta {
            font-size: 0.7rem;
            color: var(--mb-text-muted);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .news-tag {
            padding: 0.2rem 0.5rem;
            background: var(--mb-accent-glow);
            border-radius: 4px;
            color: var(--mb-accent-primary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* === CODE REVIEW COUNTER === */
        .review-counter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            background: var(--mb-bg-tertiary);
            border: 1px solid var(--mb-border);
            border-radius: 10px;
            margin-top: 1rem;
            transition: all 0.3s ease;
        }
        
        .review-counter:hover {
            border-color: var(--mb-accent-primary);
            background: var(--mb-accent-glow);
        }
        
        .review-label {
            font-size: 0.85rem;
            color: var(--mb-text-secondary);
            font-weight: 500;
        }
        
        .review-count {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--mb-accent-primary);
            font-family: 'Roboto Mono', monospace;
        }
        
        /* === DATA VISUALIZATION === */
        .velocity-chart {
            height: 80px;
            background: var(--mb-bg-tertiary);
            border-radius: 8px;
            padding: 0.8rem;
            display: flex;
            align-items: flex-end;
            gap: 4px;
            margin-top: 1rem;
        }
        
        .velocity-bar {
            flex: 1;
            background: var(--mb-gradient-accent);
            border-radius: 2px 2px 0 0;
            min-height: 20%;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .velocity-bar:hover {
            opacity: 0.8;
            transform: scaleY(1.05);
        }
        
        /* === RESPONSIVE DESIGN === */
        @media (max-width: 1400px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .metrics-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 60px;
            }
            
            .main-content {
                margin-left: 60px;
            }
            
            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .user-info {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Icon-Focused Sidebar -->
    <div class="sidebar">
        <img src="../images/mercedes-logo.png" alt="MB" class="sidebar-logo">
        <ul class="nav-menu">
            <a href="?page=home&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo ($page === 'home' || !isset($_GET['page'])) ? 'active' : ''; ?>">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Dashboard</span>
            </a>
            <a href="?page=reports&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>&report_id=510" class="nav-item <?php echo $page === 'reports' ? 'active' : ''; ?>">
                <span class="nav-icon">📈</span>
                <span class="nav-label">Reports</span>
            </a>
            <a href="?page=projects&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo $page === 'projects' ? 'active' : ''; ?>">
                <span class="nav-icon">🚗</span>
                <span class="nav-label">Projects</span>
            </a>
            <a href="?page=team&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo $page === 'team' ? 'active' : ''; ?>">
                <span class="nav-icon">👥</span>
                <span class="nav-label">Team</span>
            </a>
            <a href="?page=tasks&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo $page === 'tasks' ? 'active' : ''; ?>">
                <span class="nav-icon">✅</span>
                <span class="nav-label">Tasks</span>
            </a>
            <a href="?page=timesheet&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo $page === 'timesheet' ? 'active' : ''; ?>">
                <span class="nav-icon">⏰</span>
                <span class="nav-label">Timesheet</span>
            </a>
            <div class="nav-separator"></div>
            <a href="?page=profile&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="nav-item <?php echo $page === 'profile' ? 'active' : ''; ?>">
                <span class="nav-icon">⚙</span>
                <span class="nav-label">Settings</span>
            </a>
            <a href="logout.php" class="nav-item">
                <span class="nav-icon">⏻</span>
                <span class="nav-label">Logout</span>
            </a>
        </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Sophisticated Top Bar -->
        <div class="top-bar">
            <div class="header-left">
                <h1 class="page-title">MBTI Insights</h1>
                <span class="portal-badge">Tech Innovation</span>
            </div>
            <div class="header-right">
                <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Light/Dark Mode">
                    <span id="theme-icon">☀</span>
                </div>
                <div class="user-badge">
                    <div class="user-avatar"><?php echo strtoupper(substr($full_name, 0, 2)); ?></div>
                    <div class="user-info">
                        <div class="user-name"><?php echo htmlspecialchars($full_name); ?></div>
                        <div class="user-id"><?php echo htmlspecialchars($employee_id); ?></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-area">
            <?php if ($page === 'home' || !isset($_GET['page'])): ?>

            <div class="dashboard-grid">
                <!-- Left Column -->
                <div class="grid-left">
                    <!-- Module 1: Team & Collaboration Hub -->
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-title">
                                <span class="module-title-icon">👥</span>
                                Team & Collaboration Hub
                            </div>
                            <a href="?page=team&uid=<?php echo htmlspecialchars($employee_id); ?>" class="module-action">View All →</a>
                        </div>
                        
                        <div class="team-item">
                            <div class="team-status-indicator status-urgent"></div>
                            <div class="team-content">
                                <div class="team-title">ADAS Integration Sprint Planning - Delay</div>
                                <div class="team-meta">sarah.schmidt@mbti.local • 2 hours ago</div>
                                <span class="team-badge badge-security">Critical Update</span>
                            </div>
                        </div>
                        
                        <div class="team-item">
                            <div class="team-status-indicator status-progress"></div>
                            <div class="team-content">
                                <div class="team-title">EQS Autonomous Driving Module - Code Review</div>
                                <div class="team-meta">thomas.mueller@mbti.local • 5 hours ago</div>
                                <span class="team-badge badge-review">Code Review</span>
                            </div>
                        </div>
                        
                        <div class="team-item">
                            <div class="team-status-indicator status-resolved"></div>
                            <div class="team-content">
                                <div class="team-title">Security Compliance Audit - Completed</div>
                                <div class="team-meta">anna.fischer@mbti.local • 1 day ago</div>
                                <span class="team-badge badge-security">Security</span>
                            </div>
                        </div>
                        
                        <div class="review-counter">
                            <span class="review-label">Code Reviews Pending</span>
                            <span class="review-count">7</span>
                        </div>
                    </div>

                    <!-- Module 2: Key Performance Metrics -->
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-title">
                                <span class="module-title-icon">📊</span>
                                Key Performance Metrics
                            </div>
                            <span class="module-action">Real-time</span>
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="metric-widget">
                                <div class="metric-label">Project Health</div>
                                <div class="metric-value">94<span style="font-size: 1.2rem; opacity: 0.6;">/100</span></div>
                                <div class="metric-trend">↗ +2.3% vs last sprint</div>
                            </div>
                            
                            <div class="metric-widget">
                                <div class="metric-label">Sprint Velocity</div>
                                <div class="metric-value">48<span style="font-size: 1.2rem; opacity: 0.6;">pts</span></div>
                                <div class="metric-trend">↗ +12% this quarter</div>
                            </div>
                            
                            <div class="metric-widget">
                                <div class="metric-label">Code Coverage</div>
                                <div class="metric-value">87<span style="font-size: 1.2rem; opacity: 0.6;">%</span></div>
                                <div class="metric-trend">↗ +3% this month</div>
                            </div>
                            
                            <div class="metric-widget">
                                <div class="metric-label">Time Utilization</div>
                                <div class="metric-value">92<span style="font-size: 1.2rem; opacity: 0.6;">%</span></div>
                                <div class="metric-trend negative">↘ -1.5% vs target</div>
                            </div>
                        </div>
                        
                        <div class="velocity-chart">
                            <div class="velocity-bar" style="height: 45%;"></div>
                            <div class="velocity-bar" style="height: 62%;"></div>
                            <div class="velocity-bar" style="height: 53%;"></div>
                            <div class="velocity-bar" style="height: 78%;"></div>
                        </div>
                    </div>

                    <!-- Module 3: Project Portfolio Status -->
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-title">
                                <span class="module-title-icon">🔷</span>
                                Project Portfolio Status
                            </div>
                            <a href="?page=projects&uid=<?php echo htmlspecialchars($employee_id); ?>" class="module-action">All Projects →</a>
                        </div>
                        
                        <div class="project-list">
                            <div class="project-card">
                                <div class="project-header">
                                    <div>
                                        <div class="project-name">EQS Digital Cockpit Development</div>
                                        <div class="project-meta">Milestone: Dec 15, 2025 • Team: UX Engineering</div>
                                    </div>
                                    <div class="project-status status-on-track">On Track</div>
                                </div>
                                <div class="project-progress">
                                    <div class="progress-label">
                                        <span>Progress</span>
                                        <span>78%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 78%;"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="project-card">
                                <div class="project-header">
                                    <div>
                                        <div class="project-name">MBUX Voice Assistant v3.0</div>
                                        <div class="project-meta">Milestone: Jan 20, 2026 • Team: AI/ML</div>
                                    </div>
                                    <div class="project-status status-on-track">On Track</div>
                                </div>
                                <div class="project-progress">
                                    <div class="progress-label">
                                        <span>Progress</span>
                                        <span>62%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 62%;"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="project-card">
                                <div class="project-header">
                                    <div>
                                        <div class="project-name">Electric Powertrain Optimization</div>
                                        <div class="project-meta">Milestone: Feb 10, 2026 • Team: EV Engineering</div>
                                    </div>
                                    <div class="project-status status-at-risk">At Risk</div>
                                </div>
                                <div class="project-progress">
                                    <div class="progress-label">
                                        <span>Progress</span>
                                        <span>43%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 43%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="grid-right">
                    <!-- Module 4: Organizational News & Innovation Feed -->
                    <div class="module-card">
                        <div class="module-header">
                            <div class="module-title">
                                <span class="module-title-icon">📢</span>
                                Innovation Feed
                            </div>
                            <a href="#" class="module-action">View All →</a>
                        </div>
                        
                        <div class="news-feed">
                            <div class="news-item">
                                <div class="news-icon">🎯</div>
                                <div class="news-content">
                                    <div class="news-title">Innovation Week 2026 Registration Open</div>
                                    <div class="news-description">Join us for Mercedes-Benz's annual innovation showcase featuring cutting-edge automotive technology.</div>
                                    <div class="news-meta">
                                        <span>3 hours ago</span>
                                        <span class="news-tag">Event</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="news-item">
                                <div class="news-icon">🔒</div>
                                <div class="news-content">
                                    <div class="news-title">New Software Update Policy Deployed</div>
                                    <div class="news-description">Updated cybersecurity protocols now in effect. All developers must complete mandatory training.</div>
                                    <div class="news-meta">
                                        <span>1 day ago</span>
                                        <span class="news-tag">Mandatory</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="news-item">
                                <div class="news-icon">🏆</div>
                                <div class="news-content">
                                    <div class="news-title">Internal QA Tech Innovation Winners</div>
                                    <div class="news-description">Congratulations to the Q4 innovation challenge winners. Projects will be featured in the next town hall.</div>
                                    <div class="news-meta">
                                        <span>2 days ago</span>
                                        <span class="news-tag">Awards</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="news-item">
                                <div class="news-icon">⚡</div>
                                <div class="news-content">
                                    <div class="news-title">EV Charging Infrastructure Expansion</div>
                                    <div class="news-description">New ultra-fast charging stations deployed across MBTI facilities. 350kW charging now available.</div>
                                    <div class="news-meta">
                                        <span>3 days ago</span>
                                        <span class="news-tag">Update</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="assignment-item">
                        <div class="item-title">Mercedes me App v3.0</div>
                        <div class="assignment-due">Milestone: Jan 20, 2026</div>
                        <div class="assignment-course">Team: Mobile Development</div>
                    </div>
                    
                    <div class="assignment-item">
                        <div class="item-title">Battery Management System Optimization</div>
                        <div class="assignment-due">Milestone: Feb 10, 2026</div>
                        <div class="assignment-course">Team: EV Technology</div>
                    </div>
                    
                    <div class="assignment-item">
                        <div class="item-title">Cloud-Based Navigation Platform</div>
                        <div class="assignment-due">Milestone: Mar 05, 2026</div>
                        <div class="assignment-course">Team: Connected Services</div>
                    </div>
                    
                    <div class="assignment-item">
                        <div class="item-title">Vehicle-to-Grid Integration</div>
                        <div class="assignment-due">Milestone: Apr 15, 2026</div>
                        <div class="assignment-course">Team: Smart Grid</div>
                    </div>
                    
                    <div class="assignment-item">
                        <div class="item-title">AI-Powered Predictive Maintenance</div>
                        <div class="assignment-due">Milestone: May 01, 2026</div>
                        <div class="assignment-course">Team: Machine Learning</div>
                    </div>
                    
                    <a href="?page=projects&uid=<?php echo htmlspecialchars($uid ?? $employee_id); ?>" class="view-all-link">View All Projects →</a>
                </div>

                <!-- Company Announcements -->
                <div class="card">
                    <div class="card-header">Company Announcements</div>
                    
                    <div class="notice-item">
                        <div class="item-title">Innovation Week 2026 Registration Open</div>
                        <div class="notice-posted">Posted: Nov 10, 2025</div>
                        <div class="item-content">Join us for Mercedes-Benz Tech Innovation Week from Jan 15-19. Register now for workshops on AI, autonomous driving, and EV technology....</div>
                        <div class="notice-author">By: lars.hoffmann@mbti.local</div>
                    </div>
                    
                    <div class="notice-item">
                        <div class="item-title">Stuttgart Office Network Upgrade</div>
                        <div class="notice-posted">Posted: Nov 08, 2025</div>
                        <div class="item-content">Network infrastructure upgrades scheduled for Nov 20, 2025, 6 PM - 10 PM CET. Minimal disruption expected....</div>
                        <div class="notice-author">By: IT Department</div>
                    </div>
                    
                    <div class="notice-item">
                        <div class="item-title">Q4 Tech Innovation Awards</div>
                        <div class="notice-posted">Posted: Nov 05, 2025</div>
                        <div class="item-content">Nominate outstanding projects and team members for the quarterly innovation awards. Submissions close Dec 1....</div>
                        <div class="notice-author">By: HR Department</div>
                    </div>
                    
                    <a href="?page=announcements&uid=<?php echo htmlspecialchars($employee_id); ?>" class="view-all-link">View All Announcements →</a>
                </div>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'projects'): ?>
            <style>
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                .page-projects .project-card {
                    background: var(--mb-bg-secondary);
                    border: 1px solid var(--mb-border);
                    border-radius: 16px;
                    padding: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                .page-projects .project-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--mb-gradient-accent);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .page-projects .project-card:hover {
                    border-color: var(--mb-accent-primary);
                    box-shadow: 0 8px 32px var(--mb-accent-glow);
                    transform: translateY(-4px);
                }
                .page-projects .project-card:hover::before {
                    opacity: 1;
                }
                .page-projects .project-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .page-projects .project-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--mb-text-primary);
                    margin-bottom: 0.3rem;
                }
                .page-projects .project-status {
                    padding: 0.3rem 0.7rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .page-projects .status-in-progress {
                    background: rgba(0, 173, 239, 0.15);
                    color: var(--mb-accent-primary);
                    border: 1px solid rgba(0, 173, 239, 0.3);
                }
                .page-projects .status-planning {
                    background: rgba(255, 184, 0, 0.15);
                    color: var(--mb-status-yellow);
                    border: 1px solid rgba(255, 184, 0, 0.3);
                }
                .page-projects .status-testing {
                    background: rgba(0, 208, 132, 0.15);
                    color: var(--mb-status-green);
                    border: 1px solid rgba(0, 208, 132, 0.3);
                }
                .page-projects .project-description {
                    color: var(--mb-text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }
                .page-projects .project-meta {
                    display: flex;
                    gap: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--mb-border);
                    font-size: 0.8rem;
                    color: var(--mb-text-muted);
                }
                .page-projects .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                .page-projects .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: var(--mb-bg-primary);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                .page-projects .progress-fill {
                    height: 100%;
                    background: var(--mb-gradient-accent);
                    transition: width 1s ease;
                    position: relative;
                }
                .page-projects .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmer 2s infinite;
                }
                .page-projects .team-avatars {
                    display: flex;
                    margin-top: 1rem;
                }
                .page-projects .avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--mb-gradient-accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: 2px solid var(--mb-bg-primary);
                    margin-left: -8px;
                }
                .page-projects .avatar:first-child {
                    margin-left: 0;
                }
            </style>
            
            <h2 style="font-size: 1.5rem; color: var(--mb-text-primary); margin-bottom: 0.5rem;">My Projects</h2>
            <p style="color: var(--mb-text-secondary); margin-bottom: 1.5rem;">You are currently assigned to 3 active projects</p>
            
            <div class="projects-grid page-projects">
                <!-- Project 1: EQS Digital Cockpit -->
                <div class="project-card status-in-progress">
                    <div class="project-header">
                        <div>
                            <div class="project-title">EQS Digital Cockpit Development</div>
                            <div style="font-size: 0.8rem; color: var(--mb-text-muted); font-family: 'Roboto Mono', monospace;">MBTI-2024-001</div>
                        </div>
                        <span class="project-status status-in-progress">In Progress</span>
                    </div>
                    <div class="project-description">
                        Developing next-generation MBUX Hyperscreen interface for the Mercedes-EQS with AI-powered personalization and advanced voice control features.
                    </div>
                    <div style="margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--mb-text-secondary);">
                        <strong>Progress:</strong> 67%
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 67%;"></div>
                    </div>
                    <div class="project-meta">
                        <div class="meta-item">
                            <span>📅</span>
                            <span>Due: Dec 15, 2025</span>
                        </div>
                        <div class="meta-item">
                            <span>👥</span>
                            <span>8 members</span>
                        </div>
                    </div>
                    <div class="team-avatars">
                        <div class="avatar">TM</div>
                        <div class="avatar">SS</div>
                        <div class="avatar">MW</div>
                        <div class="avatar">+5</div>
                    </div>
                </div>
                
                <!-- Project 2: Mercedes me App -->
                <div class="project-card status-planning">
                    <div class="project-header">
                        <div>
                            <div class="project-title">Mercedes me App v3.0</div>
                            <div style="font-size: 0.8rem; color: var(--mb-text-muted); font-family: 'Roboto Mono', monospace;">MBTI-2024-042</div>
                        </div>
                        <span class="project-status status-planning">Planning</span>
                    </div>
                    <div class="project-description">
                        Complete redesign of the Mercedes me mobile application with enhanced remote vehicle control, real-time diagnostics, and AI-powered maintenance predictions.
                    </div>
                    <div style="margin-bottom: 0.5rem; font-size: 0.85rem; color: #555;">
                        <strong>Progress:</strong> 23%
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 23%;"></div>
                    </div>
                    <div class="project-meta">
                        <div class="meta-item">
                            <span>📅</span>
                            <span>Due: Jan 20, 2026</span>
                        </div>
                        <div class="meta-item">
                            <span>👥</span>
                            <span>12 members</span>
                        </div>
                    </div>
                    <div class="team-avatars">
                        <div class="avatar" style="background: #ffa726;">JS</div>
                        <div class="avatar" style="background: #4169e1;">AF</div>
                        <div class="avatar" style="background: #e91e63;">LH</div>
                        <div class="avatar" style="background: #9c27b0;">+9</div>
                    </div>
                </div>
                
                <!-- Project 3: Battery Management System -->
                <div class="project-card status-testing">
                    <div class="project-header">
                        <div>
                            <div class="project-title">Battery Management System Optimization</div>
                            <div style="font-size: 0.8rem; color: #888;">MBTI-2024-027</div>
                        </div>
                        <span class="project-status status-testing">Testing</span>
                    </div>
                    <div class="project-description">
                        Optimizing battery efficiency algorithms for EQE and EQS models, targeting 15% improvement in range estimation accuracy and thermal management.
                    </div>
                    <div style="margin-bottom: 0.5rem; font-size: 0.85rem; color: #555;">
                        <strong>Progress:</strong> 89%
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 89%;"></div>
                    </div>
                    <div class="project-meta">
                        <div class="meta-item">
                            <span>📅</span>
                            <span>Due: Feb 10, 2026</span>
                        </div>
                        <div class="meta-item">
                            <span>👥</span>
                            <span>6 members</span>
                        </div>
                    </div>
                    <div class="team-avatars">
                        <div class="avatar" style="background: #66bb6a;">MW</div>
                        <div class="avatar" style="background: #00adef;">SS</div>
                        <div class="avatar" style="background: #ff9800;">+4</div>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'tasks'): ?>
            <style>
                .task-filters {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }
                .filter-btn {
                    padding: 0.5rem 1.25rem;
                    border: 1px solid #d0d0d0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .filter-btn:hover {
                    background: #f5f5f5;
                    border-color: #4169e1;
                }
                .filter-btn.active {
                    background: #4169e1;
                    color: white;
                    border-color: #4169e1;
                }
                .tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .task-item {
                    background: white;
                    border-radius: 8px;
                    padding: 1.25rem;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                    transition: all 0.2s;
                    border-left: 3px solid #e0e0e0;
                }
                .task-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                    border-left-color: #4169e1;
                }
                .task-item.priority-high {
                    border-left-color: #f44336;
                }
                .task-item.priority-medium {
                    border-left-color: #ff9800;
                }
                .task-item.priority-low {
                    border-left-color: #66bb6a;
                }
                .task-checkbox {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #d0d0d0;
                    border-radius: 4px;
                    cursor: pointer;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .task-content {
                    flex: 1;
                }
                .task-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #2c2c2c;
                    margin-bottom: 0.4rem;
                }
                .task-description {
                    font-size: 0.85rem;
                    color: #666;
                    line-height: 1.4;
                    margin-bottom: 0.75rem;
                }
                .task-footer {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .task-badge {
                    padding: 0.25rem 0.65rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .priority-badge.high {
                    background: #ffebee;
                    color: #c62828;
                }
                .priority-badge.medium {
                    background: #fff3e0;
                    color: #e65100;
                }
                .priority-badge.low {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                .project-tag {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                .task-due {
                    font-size: 0.85rem;
                    color: #777;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                .task-assignee {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #777;
                }
            </style>
            
            <h2 style="font-size: 1.5rem; color: #2c2c2c; margin-bottom: 0.5rem;">My Tasks</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">You have <strong>7 pending tasks</strong> across your active projects</p>
            
            <div class="task-filters">
                <button class="filter-btn active">All Tasks (7)</button>
                <button class="filter-btn">High Priority (2)</button>
                <button class="filter-btn">Medium Priority (3)</button>
                <button class="filter-btn">Low Priority (2)</button>
                <button class="filter-btn">Due This Week (4)</button>
            </div>
            
            <div class="tasks-list">
                <!-- Task 1: High Priority -->
                <div class="task-item priority-high">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Complete MBUX Hyperscreen API Integration</div>
                        <div class="task-description">
                            Finalize REST API endpoints for voice control module and integrate with cloud services. Need to ensure latency is under 200ms for real-time responses.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge high">HIGH PRIORITY</span>
                            <span class="task-badge project-tag">EQS Digital Cockpit</span>
                            <div class="task-due">📅 Due: Nov 15, 2025</div>
                            <div class="task-assignee">👤 Assigned by Thomas Müller</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 2: High Priority -->
                <div class="task-item priority-high">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Security Audit Report for Mobile App</div>
                        <div class="task-description">
                            Review penetration testing results and create comprehensive security report for Mercedes me App v3.0 before stakeholder presentation.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge high">HIGH PRIORITY</span>
                            <span class="task-badge project-tag">Mercedes me App v3.0</span>
                            <div class="task-due">📅 Due: Nov 16, 2025</div>
                            <div class="task-assignee">👤 Assigned by Anna Fischer</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 3: Medium Priority -->
                <div class="task-item priority-medium">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Update Battery Thermal Algorithm Documentation</div>
                        <div class="task-description">
                            Document recent changes to thermal management algorithms and create technical specification for engineering review board.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge medium">MEDIUM</span>
                            <span class="task-badge project-tag">Battery Management</span>
                            <div class="task-due">📅 Due: Nov 20, 2025</div>
                            <div class="task-assignee">👤 Assigned by Michael Weber</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 4: Medium Priority -->
                <div class="task-item priority-medium">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Code Review: Navigation Routing Module</div>
                        <div class="task-description">
                            Review 2,400 lines of TypeScript code for the new cloud-based navigation routing engine. Focus on performance optimization and error handling.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge medium">MEDIUM</span>
                            <span class="task-badge project-tag">Cloud Navigation</span>
                            <div class="task-due">📅 Due: Nov 22, 2025</div>
                            <div class="task-assignee">👤 Assigned by Sarah Schmidt</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 5: Medium Priority -->
                <div class="task-item priority-medium">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Prepare Q4 Sprint Retrospective Presentation</div>
                        <div class="task-description">
                            Compile team metrics, completed features, and improvement suggestions for quarterly retrospective meeting with stakeholders.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge medium">MEDIUM</span>
                            <span class="task-badge project-tag">Team Management</span>
                            <div class="task-due">📅 Due: Nov 25, 2025</div>
                            <div class="task-assignee">👤 Assigned by Lars Hoffmann</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 6: Low Priority -->
                <div class="task-item priority-low">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Update Developer Onboarding Guide</div>
                        <div class="task-description">
                            Add new sections covering Docker workflow, CI/CD pipeline, and updated coding standards for new team members joining in Q1 2026.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge low">LOW</span>
                            <span class="task-badge project-tag">Documentation</span>
                            <div class="task-due">📅 Due: Nov 30, 2025</div>
                            <div class="task-assignee">👤 Self-assigned</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task 7: Low Priority -->
                <div class="task-item priority-low">
                    <div class="task-checkbox"></div>
                    <div class="task-content">
                        <div class="task-title">Submit Innovation Week 2026 Proposal</div>
                        <div class="task-description">
                            Draft proposal for AI-powered predictive maintenance demonstration at upcoming Innovation Week event. Include technical feasibility and resource requirements.
                        </div>
                        <div class="task-footer">
                            <span class="task-badge priority-badge low">LOW</span>
                            <span class="task-badge project-tag">Innovation</span>
                            <div class="task-due">📅 Due: Dec 05, 2025</div>
                            <div class="task-assignee">👤 Self-assigned</div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'timesheet'): ?>
            <style>
                .timesheet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .week-selector {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                }
                .week-nav-btn {
                    background: #f5f5f5;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.2s;
                }
                .week-nav-btn:hover {
                    background: #4169e1;
                    color: white;
                }
                .current-week {
                    font-weight: 600;
                    color: #2c2c2c;
                }
                .timesheet-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .summary-card {
                    background: white;
                    padding: 1.25rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                }
                .summary-label {
                    font-size: 0.85rem;
                    color: #777;
                    margin-bottom: 0.5rem;
                }
                .summary-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #2c2c2c;
                }
                .summary-value.hours {
                    color: #4169e1;
                }
                .summary-value.pending {
                    color: #ff9800;
                }
                .summary-value.approved {
                    color: #66bb6a;
                }
                .timesheet-table {
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    margin-bottom: 1.5rem;
                }
                .timesheet-table table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .timesheet-table th {
                    background: #f8f9fa;
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                    color: #2c2c2c;
                    border-bottom: 2px solid #e0e0e0;
                }
                .timesheet-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #f0f0f0;
                }
                .timesheet-table tr:hover {
                    background: #f8f9fa;
                }
                .day-cell {
                    font-weight: 600;
                    color: #2c2c2c;
                }
                .hours-input {
                    width: 60px;
                    padding: 0.5rem;
                    border: 1px solid #d0d0d0;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 0.9rem;
                }
                .hours-input:focus {
                    outline: none;
                    border-color: #4169e1;
                }
                .project-select {
                    padding: 0.5rem;
                    border: 1px solid #d0d0d0;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    color: #2c2c2c;
                    background: white;
                }
                .total-row {
                    background: #f0f7ff !important;
                    font-weight: 600;
                }
                .submit-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 1.25rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                }
                .submit-btn {
                    background: #4169e1;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .submit-btn:hover {
                    background: #2c4fb8;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(65,105,225,0.3);
                }
                .status-badge {
                    padding: 0.35rem 0.85rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .status-draft {
                    background: #fff3e0;
                    color: #e65100;
                }
            </style>
            
            <h2 style="font-size: 1.5rem; color: #2c2c2c; margin-bottom: 0.5rem;">Timesheet</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">Log your work hours and submit for approval</p>
            
            <div class="timesheet-header">
                <div class="week-selector">
                    <button class="week-nav-btn">‹</button>
                    <span class="current-week">Week of Nov 10 - Nov 16, 2025</span>
                    <button class="week-nav-btn">›</button>
                </div>
                <span class="status-badge status-draft">DRAFT</span>
            </div>
            
            <div class="timesheet-summary">
                <div class="summary-card">
                    <div class="summary-label">Total Hours This Week</div>
                    <div class="summary-value hours">38.5h</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Overtime Hours</div>
                    <div class="summary-value">0h</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Pending Approval</div>
                    <div class="summary-value pending">80h</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Approved This Month</div>
                    <div class="summary-value approved">152h</div>
                </div>
            </div>
            
            <div class="timesheet-table">
                <table>
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Project</th>
                            <th style="text-align: center;">Hours</th>
                            <th>Task Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="day-cell">Mon, Nov 10</td>
                            <td>
                                <select class="project-select">
                                    <option selected>EQS Digital Cockpit</option>
                                    <option>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="8.0" step="0.5" min="0" max="24">
                            </td>
                            <td>MBUX API integration and testing</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Tue, Nov 11</td>
                            <td>
                                <select class="project-select">
                                    <option selected>EQS Digital Cockpit</option>
                                    <option>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="7.5" step="0.5" min="0" max="24">
                            </td>
                            <td>Voice control module development</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Wed, Nov 12</td>
                            <td>
                                <select class="project-select">
                                    <option>EQS Digital Cockpit</option>
                                    <option selected>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="8.0" step="0.5" min="0" max="24">
                            </td>
                            <td>Security audit and penetration testing</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Thu, Nov 13</td>
                            <td>
                                <select class="project-select">
                                    <option>EQS Digital Cockpit</option>
                                    <option selected>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="8.0" step="0.5" min="0" max="24">
                            </td>
                            <td>API documentation and code review</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Fri, Nov 14</td>
                            <td>
                                <select class="project-select">
                                    <option>EQS Digital Cockpit</option>
                                    <option>Mercedes me App v3.0</option>
                                    <option selected>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="7.0" step="0.5" min="0" max="24">
                            </td>
                            <td>Thermal algorithm documentation</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Sat, Nov 15</td>
                            <td>
                                <select class="project-select">
                                    <option>EQS Digital Cockpit</option>
                                    <option>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="0" step="0.5" min="0" max="24">
                            </td>
                            <td style="color: #999;">-</td>
                        </tr>
                        <tr>
                            <td class="day-cell">Sun, Nov 16</td>
                            <td>
                                <select class="project-select">
                                    <option>EQS Digital Cockpit</option>
                                    <option>Mercedes me App v3.0</option>
                                    <option>Battery Management</option>
                                </select>
                            </td>
                            <td style="text-align: center;">
                                <input type="number" class="hours-input" value="0" step="0.5" min="0" max="24">
                            </td>
                            <td style="color: #999;">-</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right; padding-right: 1rem;"><strong>Weekly Total:</strong></td>
                            <td style="text-align: center;"><strong>38.5h</strong></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="submit-section">
                <div style="color: #666; font-size: 0.9rem;">
                    💡 <strong>Reminder:</strong> Submit your timesheet by Friday 5:00 PM for timely processing
                </div>
                <button class="submit-btn">Submit for Approval</button>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'team'): ?>
            <style>
                .teams-container {
                    display: flex;
                    gap: 1.5rem;
                }
                .teams-sidebar {
                    width: 280px;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    height: fit-content;
                }
                .teams-main {
                    flex: 1;
                }
                .team-search {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d0d0d0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                .team-search:focus {
                    outline: none;
                    border-color: #4169e1;
                }
                .team-category {
                    margin-bottom: 1.5rem;
                }
                .category-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #777;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.75rem;
                    padding-left: 0.5rem;
                }
                .team-list-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 0.25rem;
                }
                .team-list-item:hover {
                    background: #f5f5f5;
                }
                .team-list-item.active {
                    background: #e3f2fd;
                    border-left: 3px solid #4169e1;
                    padding-left: calc(0.5rem - 3px);
                }
                .team-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }
                .team-name {
                    font-size: 0.9rem;
                    color: #2c2c2c;
                    font-weight: 500;
                }
                .members-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1rem;
                }
                .member-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .member-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .member-header {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .member-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                    position: relative;
                }
                .member-avatar.online::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: #44b700;
                    border: 2px solid white;
                    border-radius: 50%;
                }
                .member-avatar.busy::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: #c50f1f;
                    border: 2px solid white;
                    border-radius: 50%;
                }
                .member-avatar.away::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: #ffaa44;
                    border: 2px solid white;
                    border-radius: 50%;
                }
                .member-info {
                    flex: 1;
                }
                .member-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c2c2c;
                    margin-bottom: 0.25rem;
                }
                .member-role {
                    font-size: 0.85rem;
                    color: #777;
                    margin-bottom: 0.25rem;
                }
                .member-status {
                    font-size: 0.8rem;
                    color: #999;
                    font-style: italic;
                }
                .member-contact {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f0f0f0;
                }
                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #666;
                }
                .contact-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .action-btn {
                    flex: 1;
                    padding: 0.6rem;
                    border: 1px solid #d0d0d0;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                }
                .action-btn:hover {
                    background: #f5f5f5;
                    border-color: #4169e1;
                    color: #4169e1;
                }
                .team-header-section {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                    margin-bottom: 1.5rem;
                }
                .team-stats {
                    display: flex;
                    gap: 2rem;
                    margin-top: 1rem;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: #666;
                }
                .stat-number {
                    font-weight: 700;
                    color: #4169e1;
                }
            </style>
            
            <div class="teams-container">
                <!-- Left Sidebar - Teams List -->
                <div class="teams-sidebar">
                    <input type="text" class="team-search" placeholder="Search teams or people...">
                    
                    <div class="team-category">
                        <div class="category-title">Your Teams</div>
                        <div class="team-list-item active">
                            <div class="team-icon" style="background: linear-gradient(135deg, #4169e1 0%, #00adef 100%);">EV</div>
                            <div class="team-name">EV Technology</div>
                        </div>
                        <div class="team-list-item">
                            <div class="team-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">MD</div>
                            <div class="team-name">Mobile Dev</div>
                        </div>
                        <div class="team-list-item">
                            <div class="team-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">UX</div>
                            <div class="team-name">UX Design</div>
                        </div>
                        <div class="team-list-item">
                            <div class="team-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">CS</div>
                            <div class="team-name">Connected Services</div>
                        </div>
                    </div>
                    
                    <div class="team-category">
                        <div class="category-title">Departments</div>
                        <div class="team-list-item">
                            <div class="team-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">EN</div>
                            <div class="team-name">Engineering</div>
                        </div>
                        <div class="team-list-item">
                            <div class="team-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">PR</div>
                            <div class="team-name">Product</div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content - Team Members -->
                <div class="teams-main">
                    <div class="team-header-section">
                        <h2 style="font-size: 1.5rem; color: #2c2c2c; margin-bottom: 0.5rem;">EV Technology Team</h2>
                        <p style="color: #666; margin-bottom: 0;">Developing next-generation electric vehicle technologies and battery management systems</p>
                        <div class="team-stats">
                            <div class="stat-item">
                                <span class="stat-number">12</span>
                                <span>members</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">8</span>
                                <span>online</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">3</span>
                                <span>active projects</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="members-grid">
                        <!-- Member 1 - Current User -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar online">JS</div>
                                <div class="member-info">
                                    <div class="member-name">Julia Schneider (You)</div>
                                    <div class="member-role">Software Engineer</div>
                                    <div class="member-status">Available</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>julia.schneider@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-4837</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Stuttgart Office, Building A</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Member 2 -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar online">TM</div>
                                <div class="member-info">
                                    <div class="member-name">Thomas Müller</div>
                                    <div class="member-role">Senior Software Engineer</div>
                                    <div class="member-status">In a meeting</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>thomas.mueller@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-2001</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Stuttgart Office, Building A</span>
                                </div>
                            </div>
                            <div class="contact-actions">
                                <button class="action-btn">💬 Chat</button>
                                <button class="action-btn">📞 Call</button>
                            </div>
                        </div>
                        
                        <!-- Member 3 -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar online">MW</div>
                                <div class="member-info">
                                    <div class="member-name">Michael Weber</div>
                                    <div class="member-role">Lead Engineer - Battery Systems</div>
                                    <div class="member-status">Available</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>michael.weber@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-2003</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Stuttgart Office, Building B</span>
                                </div>
                            </div>
                            <div class="contact-actions">
                                <button class="action-btn">💬 Chat</button>
                                <button class="action-btn">📞 Call</button>
                            </div>
                        </div>
                        
                        <!-- Member 4 -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar busy">SS</div>
                                <div class="member-info">
                                    <div class="member-name">Sarah Schmidt</div>
                                    <div class="member-role">Senior Full Stack Developer</div>
                                    <div class="member-status">Do not disturb</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>sarah.schmidt@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-2002</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Berlin Office, Building C</span>
                                </div>
                            </div>
                            <div class="contact-actions">
                                <button class="action-btn">💬 Chat</button>
                                <button class="action-btn">📞 Call</button>
                            </div>
                        </div>
                        
                        <!-- Member 5 -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar online">AF</div>
                                <div class="member-info">
                                    <div class="member-name">Anna Fischer</div>
                                    <div class="member-role">DevOps Engineer</div>
                                    <div class="member-status">Available</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>anna.fischer@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-2004</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Stuttgart Office, Building A</span>
                                </div>
                            </div>
                            <div class="contact-actions">
                                <button class="action-btn">💬 Chat</button>
                                <button class="action-btn">📞 Call</button>
                            </div>
                        </div>
                        
                        <!-- Member 6 -->
                        <div class="member-card">
                            <div class="member-header">
                                <div class="member-avatar away">LH</div>
                                <div class="member-info">
                                    <div class="member-name">Lars Hoffmann</div>
                                    <div class="member-role">Product Manager</div>
                                    <div class="member-status">Away - Back at 2:00 PM</div>
                                </div>
                            </div>
                            <div class="member-contact">
                                <div class="contact-item">
                                    <span>📧</span>
                                    <span>lars.hoffmann@mbti.local</span>
                                </div>
                                <div class="contact-item">
                                    <span>📱</span>
                                    <span>+49 731 505-2005</span>
                                </div>
                                <div class="contact-item">
                                    <span>📍</span>
                                    <span>Munich Office, Building D</span>
                                </div>
                            </div>
                            <div class="contact-actions">
                                <button class="action-btn">💬 Chat</button>
                                <button class="action-btn">📞 Call</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'reports'): ?>
            <?php
            // VULNERABILITY: IDOR - Display report based on report_id WITHOUT authorization check!
            if ($report_id !== null) {
                // Fetch report by ID - NO AUTHORIZATION CHECK!
                $stmt = $conn->prepare("SELECT id, employee_id, employee_name, report_title, report_content, is_confidential, submitted_at, status FROM weekly_reports WHERE id = ?");
                $stmt->bind_param("i", $report_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    $current_report = $result->fetch_assoc();
                } else {
                    $current_report = null;
                    $report_error = "Report #$report_id not found.";
                }
                $stmt->close();
            } else {
                $current_report = null;
                $report_error = "No report selected. Please specify a report_id.";
            }
            ?>
            
            <style>
                .reports-container {
                    max-width: 1200px;
                }
                .report-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }
                .report-header h2 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.75rem;
                }
                .report-header p {
                    margin: 0;
                    opacity: 0.95;
                }
                .report-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .upload-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.75rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .upload-card h3 {
                    color: #2c2c2c;
                    margin: 0 0 1.5rem 0;
                    font-size: 1.25rem;
                }
                .form-group {
                    margin-bottom: 1.25rem;
                }
                .form-label {
                    display: block;
                    font-weight: 600;
                    color: #2c2c2c;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #d0d0d0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-family: inherit;
                }
                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                .form-textarea {
                    min-height: 200px;
                    resize: vertical;
                }
                .submit-report-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 0.85rem 2rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 1rem;
                    width: 100%;
                    transition: all 0.2s;
                }
                .submit-report-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                .info-box {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1.5rem;
                }
                .info-box p {
                    margin: 0;
                    color: #1565c0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                .previous-reports {
                    background: white;
                    border-radius: 8px;
                    padding: 1.75rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .previous-reports h3 {
                    color: #2c2c2c;
                    margin: 0 0 1.5rem 0;
                    font-size: 1.25rem;
                }
                .report-item {
                    border-left: 3px solid #e0e0e0;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    background: #fafafa;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .report-item:hover {
                    border-left-color: #667eea;
                    background: #f5f5f5;
                }
                .report-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .report-item-title {
                    font-weight: 600;
                    color: #2c2c2c;
                    font-size: 0.95rem;
                }
                .report-status {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-pending {
                    background: #fff3e0;
                    color: #e65100;
                }
                .status-reviewed {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                .report-item-date {
                    font-size: 0.85rem;
                    color: #777;
                    margin-bottom: 0.5rem;
                }
                .report-item-content {
                    font-size: 0.85rem;
                    color: #666;
                    line-height: 1.5;
                }
            </style>
            
            <div class="reports-container">
                <div class="report-header">
                    <h2>📊 Report Viewer</h2>
                    <p>Viewing Report ID: <?php echo htmlspecialchars($report_id); ?></p>
                </div>
                
                <?php if (isset($report_error)): ?>
                <div class="alert-error" style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                    <strong>Error!</strong> <?php echo htmlspecialchars($report_error); ?>
                </div>
                <?php endif; ?>
                
                <?php if ($current_report): ?>
                <div class="report-display">
                    <?php if ($current_report['is_confidential']): ?>
                    <div class="confidential-banner" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 700; text-align: center;">
                        🔒 CONFIDENTIAL - MANAGER ONLY
                    </div>
                    <?php endif; ?>
                    
                    <div class="report-card" style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #667eea;">
                        <div class="report-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                            <div>
                                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Report ID</div>
                                <div style="font-weight: 600;">#<?php echo htmlspecialchars($current_report['id']); ?></div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Employee</div>
                                <div style="font-weight: 600;"><?php echo htmlspecialchars($current_report['employee_name']); ?></div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Employee ID</div>
                                <div style="font-weight: 600;"><?php echo htmlspecialchars($current_report['employee_id']); ?></div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Submitted</div>
                                <div style="font-weight: 600;"><?php echo date('M d, Y H:i', strtotime($current_report['submitted_at'])); ?></div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Status</div>
                                <div style="font-weight: 600; color: #28a745;"><?php echo strtoupper(htmlspecialchars($current_report['status'])); ?></div>
                            </div>
                        </div>
                        
                        <div class="report-title" style="font-size: 1.5rem; font-weight: 700; color: #1e3c72; margin-bottom: 1rem;">
                            <?php echo htmlspecialchars($current_report['report_title']); ?>
                        </div>
                        
                        <div class="report-content" style="background: linear-gradient(135deg, #fdfbfb 0%, #f8f9fa 100%); padding: 2rem; border-radius: 10px; line-height: 1.8; white-space: pre-wrap; border: 1px solid #e9ecef;">
                            <?php echo htmlspecialchars($current_report['report_content']); ?>
                        </div>
                        
                        <?php if ($current_report['is_confidential']): ?>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
                            <strong>⚠️ Security Notice:</strong> This is a confidential document. Unauthorized access or distribution is prohibited.
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            
            <?php if ($page === 'profile'): ?>
            <style>
                .profile-section {
                    background: white;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c2c2c;
                }
                .section-icon {
                    width: 36px;
                    height: 36px;
                    background: #e3f2fd;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .form-field {
                    display: flex;
                    flex-direction: column;
                }
                .form-field.full-width {
                    grid-column: 1 / -1;
                }
                .form-field label {
                    font-size: 0.9rem;
                    color: #555;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .form-field input {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    background: #f8f8f8;
                }
                .form-field input:focus {
                    outline: none;
                    border-color: #4169e1;
                    background: white;
                }
                .form-field input::placeholder {
                    color: #aaa;
                }
                .password-field-wrapper {
                    position: relative;
                }
                .password-field-wrapper input {
                    padding-right: 3rem;
                }
                .password-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: #666;
                    transition: color 0.2s;
                }
                .password-toggle-btn:hover {
                    color: #333;
                }
                .password-toggle-btn svg {
                    width: 20px;
                    height: 20px;
                    display: block;
                }
                .alert-success {
                    background: #d4edda;
                    border-left: 4px solid #28a745;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    color: #155724;
                    border-radius: 4px;
                    font-size: 0.95rem;
                }
                .alert-error {
                    background: #f8d7da;
                    border-left: 4px solid #dc3545;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    color: #721c24;
                    border-radius: 4px;
                    font-size: 0.95rem;
                }
                .profile-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }
                .btn-primary {
                    background: #4169e1;
                    color: white;
                    padding: 0.75rem 2rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-primary:hover {
                    background: #3156c9;
                }
                .change-password-section .section-icon {
                    background: #e8f5e9;
                }
            </style>
            
            <!-- Profile Information Section -->
            <div class="profile-section">
                <div class="section-header">
                    <div class="section-icon">👤</div>
                    <span>Profile Information</span>
                </div>
                <form method="POST" action="">
                    <div class="form-row">
                        <div class="form-field">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($employee_id); ?>" readonly>
                        </div>
                        <div class="form-field">
                            <label for="fullname">Full Name</label>
                            <input type="text" id="fullname" name="fullname" value="<?php echo htmlspecialchars($full_name); ?>" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_SESSION['email'] ?? ''); ?>" readonly>
                        </div>
                        <div class="form-field">
                            <label for="role">Role</label>
                            <input type="text" id="role" name="role" value="employee" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field full-width">
                            <label for="account_created">Account Created</label>
                            <input type="text" id="account_created" name="account_created" value="2025-11-13 00:32:49" readonly>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button type="button" class="btn-primary" onclick="alert('Profile update functionality coming soon')">Update Profile</button>
                    </div>
                </form>
            </div>
            
            <!-- Change Password Section -->
            <div class="profile-section change-password-section">
                <div class="section-header">
                    <div class="section-icon">🔒</div>
                    <span>Change Password</span>
                </div>
                
                <?php if (!empty($password_message)): ?>
                    <div class="alert-success">
                        <?php echo htmlspecialchars($password_message); ?>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($password_error)): ?>
                    <div class="alert-error">
                        <?php echo htmlspecialchars($password_error); ?>
                    </div>
                <?php endif; ?>
                
                <form method="POST" action="?page=profile" onsubmit="return validatePasswordChange()">
                    <div class="form-row">
                        <div class="form-field full-width">
                            <label for="new_password">New Password</label>
                            <div class="password-field-wrapper">
                                <input type="password" id="new_password" name="new_password" placeholder="Enter new password" required>
                                <button type="button" class="password-toggle-btn" onclick="togglePassword('new_password', this)" aria-label="Toggle password visibility">
                                    <svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg class="eye-slash-icon" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field full-width">
                            <label for="confirm_password">Confirm New Password</label>
                            <div class="password-field-wrapper">
                                <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirm new password" required>
                                <button type="button" class="password-toggle-btn" onclick="togglePassword('confirm_password', this)" aria-label="Toggle password visibility">
                                    <svg class="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg class="eye-slash-icon" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button type="submit" name="change_password" class="btn-primary">Change Password</button>
                    </div>
                </form>
            </div>
            
            <script>
                function togglePassword(fieldId, button) {
                    const field = document.getElementById(fieldId);
                    const eyeIcon = button.querySelector('.eye-icon');
                    const eyeSlashIcon = button.querySelector('.eye-slash-icon');
                    
                    if (field.type === 'password') {
                        field.type = 'text';
                        eyeIcon.style.display = 'none';
                        eyeSlashIcon.style.display = 'block';
                    } else {
                        field.type = 'password';
                        eyeIcon.style.display = 'block';
                        eyeSlashIcon.style.display = 'none';
                    }
                }
                
                function validatePasswordChange() {
                    const newPass = document.getElementById('new_password').value;
                    const confirmPass = document.getElementById('confirm_password').value;
                    
                    if (newPass !== confirmPass) {
                        alert('Passwords do not match. Please try again.');
                        return false;
                    }
                    
                    if (newPass.length < 6) {
                        alert('Password must be at least 6 characters long.');
                        return false;
                    }
                    
                    return true;
                }
            </script>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
        // Theme Toggle Functionality
        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            const icon = document.getElementById('theme-icon');
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('mbti-theme', newTheme);
            
            icon.textContent = newTheme === 'dark' ? '☀' : '🌙';
        }
        
        // Load saved theme preference
        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('mbti-theme') || 'dark';
            const icon = document.getElementById('theme-icon');
            
            document.documentElement.setAttribute('data-theme', savedTheme);
            icon.textContent = savedTheme === 'dark' ? '☀' : '🌙';
            
            // Animate progress bars on load
            const progressBars = document.querySelectorAll('.progress-fill');
            progressBars.forEach((bar, index) => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 200 + (index * 100));
            });
            
            // Animate velocity chart bars
            const velocityBars = document.querySelectorAll('.velocity-bar');
            velocityBars.forEach((bar, index) => {
                const height = bar.style.height;
                bar.style.height = '20%';
                setTimeout(() => {
                    bar.style.height = height;
                }, 400 + (index * 100));
            });
        });
    </script>
</body>
</html>
