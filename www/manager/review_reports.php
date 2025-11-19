<?php
// Manager Review Page - Zimmer Dan's Executive Dashboard
// VULNERABILITY 1: This page displays report content WITHOUT sanitization - STORED XSS!
// VULNERABILITY 2: LFI via file parameter

error_reporting(0);
session_start();

// Database connection
require_once('../portal/config.php');

// Validate manager session from database
if (!isset($_SESSION['employee_id'])) {
    // Not logged in at all - redirect to login
    header('Location: /portal/login.php');
    exit();
}

// Re-validate session data from database
$stmt = $conn->prepare("SELECT employee_id, full_name, email, department, role FROM employees WHERE employee_id = ?");
$stmt->bind_param("s", $_SESSION['employee_id']);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    // Update session with current database values
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['department'] = $user['department'];
    $_SESSION['role'] = $user['role'];
    
    // Check if user is actually a manager
    if ($user['role'] !== 'Department Manager' && $user['department'] !== 'Management') {
        // Not a manager - redirect to employee portal
        header('Location: /portal/dashboard.php');
        exit();
    }
} else {
    // Invalid session - redirect to login
    session_destroy();
    header('Location: /portal/login.php');
    exit();
}
$stmt->close();

// VULNERABILITY: LFI - File inclusion without proper validation
if (isset($_GET['file'])) {
    $file = $_GET['file'];
    // NO path validation - VULNERABLE TO LFI!
    include($file);
    exit();
}

// Fetch pending reports
$stmt = $conn->prepare("SELECT id, employee_id, employee_name, report_title, report_content, submitted_at FROM weekly_reports WHERE status = 'pending' ORDER BY submitted_at DESC");
$stmt->execute();
$result = $stmt->get_result();
$pending_reports = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Handle report review
if (isset($_POST['review_report'])) {
    $report_id = $_POST['report_id'];
    $stmt = $conn->prepare("UPDATE weekly_reports SET status = 'reviewed', reviewed_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $report_id);
    $stmt->execute();
    $stmt->close();
    header('Location: review_reports.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Dashboard - Manager Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            padding: 2rem;
        }
        
        .manager-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        /* Executive Header - Different from employee portal */
        .executive-header {
            background: linear-gradient(135deg, #141E30 0%, #243B55 100%);
            color: white;
            padding: 2.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .executive-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .executive-header h1::before {
            content: '👔 ';
        }
        
        .manager-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .manager-badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
        }
        
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 4px solid #f5576c;
        }
        
        .stat-card h3 {
            color: #666;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        
        .stat-card .number {
            font-size: 2rem;
            font-weight: 700;
            color: #1e3c72;
        }
        
        /* Report Cards - Executive Style */
        .executive-report-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left: 5px solid #f5576c;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .executive-report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 35px rgba(0,0,0,0.2);
        }
        
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 3px solid #f0f0f0;
        }
        
        .report-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1e3c72;
            line-height: 1.4;
        }
        
        .priority-badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
        }
        
        .report-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        
        .meta-label {
            font-size: 0.75rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
            font-weight: 600;
        }
        
        .meta-value {
            font-size: 0.95rem;
            color: #2c2c2c;
            font-weight: 500;
        }
        
        .report-content {
            background: linear-gradient(135deg, #fdfbfb 0%, #f8f9fa 100%);
            padding: 2rem;
            border-radius: 10px;
            margin: 1.5rem 0;
            line-height: 1.8;
            color: #2c2c2c;
            border: 1px solid #e9ecef;
            font-size: 1rem;
        }
        
        .action-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        .approve-btn {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border: none;
            padding: 0.9rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.95rem;
            box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);
            transition: all 0.3s ease;
        }
        
        .approve-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(56, 239, 125, 0.6);
        }
        
        .export-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 0.9rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.95rem;
            box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
            transition: all 0.3s ease;
        }
        
        .export-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(118, 75, 162, 0.6);
        }
        
        .no-reports {
            text-align: center;
            padding: 4rem;
            color: #666;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .no-reports h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #1e3c72;
        }
        
        /* Footer */
        .manager-footer {
            text-align: center;
            padding: 2rem;
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="manager-container">
        <div class="executive-header">
            <h1>Executive Dashboard</h1>
            <div class="manager-info">
                <div>
                    <strong style="font-size: 1.1rem;">Welcome, <?php echo $_SESSION['full_name']; ?></strong>
                    <div style="opacity: 0.8; margin-top: 0.3rem; font-size: 0.9rem;">
                        <?php echo $_SESSION['email']; ?> | Department Manager
                    </div>
                </div>
                <div class="manager-badge">
                    🎖️ MANAGER ACCESS
                </div>
            </div>
        </div>
        
        <div class="stats-bar">
            <div class="stat-card">
                <h3>PENDING REVIEWS</h3>
                <div class="number"><?php echo count($pending_reports); ?></div>
            </div>
            <div class="stat-card" style="border-left-color: #667eea;">
                <h3>THIS WEEK</h3>
                <div class="number"><?php echo count($pending_reports); ?></div>
            </div>
            <div class="stat-card" style="border-left-color: #38ef7d;">
                <h3>PRIORITY</h3>
                <div class="number">HIGH</div>
            </div>
        </div>
        
        <?php if (empty($pending_reports)): ?>
        <div class="no-reports">
            <h3>✅ All Reports Reviewed</h3>
            <p>No pending reports to review at this time. Great job staying on top of things!</p>
        </div>
        <?php else: ?>
            <?php foreach ($pending_reports as $report): ?>
            <div class="executive-report-card">
                <div class="report-header">
                    <div style="flex: 1;">
                        <div class="report-title">
                            <?php 
                            // VULNERABILITY: NO htmlspecialchars() - STORED XSS!
                            echo $report['report_title']; 
                            ?>
                        </div>
                    </div>
                    <div class="priority-badge">
                        📌 PRIORITY
                    </div>
                </div>
                
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="meta-label">Employee</span>
                        <span class="meta-value"><?php echo htmlspecialchars($report['employee_name']); ?></span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Employee ID</span>
                        <span class="meta-value"><?php echo htmlspecialchars($report['employee_id']); ?></span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Submitted</span>
                        <span class="meta-value"><?php echo date('M d, Y H:i', strtotime($report['submitted_at'])); ?></span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Report ID</span>
                        <span class="meta-value">#<?php echo $report['id']; ?></span>
                    </div>
                </div>
                
                <div class="report-content">
                    <?php 
                    // VULNERABILITY: NO htmlspecialchars() - STORED XSS EXECUTES HERE!
                    echo $report['report_content']; 
                    ?>
                </div>
                
                <div class="action-buttons">
                    <form method="POST" style="display: inline;">
                        <input type="hidden" name="report_id" value="<?php echo $report['id']; ?>">
                        <button type="submit" name="review_report" class="approve-btn">
                            ✓ Approve Report
                        </button>
                    </form>
                    
                    <!-- VULNERABILITY HINT: Export functionality uses file parameter -->
                    <button onclick="window.location.href='review_reports.php?file=exports/report_<?php echo $report['id']; ?>.txt'" class="export-btn">
                        📥 Export Report
                    </button>
                </div>
            </div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <div class="manager-footer">
            Mercedes-Benz Tech Innovation - Manager Portal<br>
            Confidential & Proprietary | <?php echo date('Y'); ?>
        </div>
    </div>
</body>
</html>
