<?php
session_start();

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.php');
    exit();
}

// VULNERABLE: Local File Inclusion (LFI)
$page = $_GET['page'] ?? 'home';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MBTI Employee Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
        }
        
        .dashboard-header {
            background: #2d2926;
            color: white;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .header-logo {
            height: 35px;
            width: auto;
            filter: brightness(0) invert(1);
        }
        
        .dashboard-header h1 {
            font-size: 1.5rem;
            font-weight: 300;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logout-btn {
            background: #00adef;
            color: white;
            padding: 0.6rem 1.5rem;
            border: none;
            border-radius: 4px;
            text-decoration: none;
            cursor: pointer;
        }
        
        .dashboard-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .welcome-card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .welcome-card h2 {
            color: #2d2926;
            margin-bottom: 1rem;
        }
        
        .flag-notice {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        
        .flag-notice h3 {
            color: #2e7d32;
            margin-bottom: 0.5rem;
        }
        
        .flag-code {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            color: #d32f2f;
            margin-top: 1rem;
        }
        
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .menu-card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
            cursor: pointer;
        }
        
        .menu-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 20px rgba(0,173,239,0.2);
        }
        
        .menu-card h3 {
            color: #2d2926;
            margin-bottom: 0.5rem;
        }
        
        .menu-card p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .content-area {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <div class="header-left">
            <img src="../images/mercedes-logo.png" alt="Mercedes-Benz" class="header-logo">
            <h1>Mercedes-Benz Tech Innovation - Employee Dashboard</h1>
        </div>
        <div class="user-info">
            <span>Welcome, <?php echo htmlspecialchars($_SESSION['full_name']); ?></span>
            <a href="logout.php" class="logout-btn">Logout</a>
        </div>
    </div>
    
    <div class="dashboard-container">
        <div class="welcome-card">
            <h2>Welcome to Your Dashboard</h2>
            <p>Employee ID: <strong><?php echo htmlspecialchars($_SESSION['employee_id']); ?></strong></p>
            <p>Email: <strong><?php echo htmlspecialchars($_SESSION['email']); ?></strong></p>
            
            <div class="flag-notice">
                <h3>🎯 Congratulations! User Flag Captured</h3>
                <p>You've successfully authenticated to the employee portal.</p>
                <div class="flag-code">
                    <?php
                    // Read user flag
                    $user_flag = @file_get_contents('/home/www-data/user.txt');
                    echo $user_flag ? htmlspecialchars($user_flag) : 'Flag file not found';
                    ?>
                </div>
            </div>
        </div>
        
        <div class="menu-grid">
            <div class="menu-card" onclick="location.href='?page=profile'">
                <h3>👤 My Profile</h3>
                <p>View and edit your profile information</p>
            </div>
            <div class="menu-card" onclick="location.href='?page=training'">
                <h3>📚 Training Programs</h3>
                <p>Access your enrolled training courses</p>
            </div>
            <div class="menu-card" onclick="location.href='?page=documents'">
                <h3>📄 Documents</h3>
                <p>View company documents and policies</p>
            </div>
            <div class="menu-card" onclick="location.href='../guides/Employee_Portal_Guide.pdf'">
                <h3>❓ Help</h3>
                <p>Employee portal user guide</p>
            </div>
        </div>
        
        <?php
        // VULNERABLE: LFI - No input validation!
        if ($page !== 'home') {
            echo '<div class="content-area">';
            echo '<h2>Content Area</h2>';
            
            // Attempt to include the page
            // This allows path traversal attacks like: ?page=../../etc/passwd
            $file_path = $page . '.php';
            
            if (file_exists($file_path)) {
                include($file_path);
            } else {
                // This is the vulnerability - it tries to include ANY file!
                @include($page);
                
                if (!file_exists($page)) {
                    echo '<p>Page not found. Try: profile, training, or documents</p>';
                    echo '<p style="color: #999; font-size: 0.8rem; margin-top: 1rem;">Debug: Attempted to load: ' . htmlspecialchars($page) . '</p>';
                }
            }
            
            echo '</div>';
        }
        ?>
    </div>
</body>
</html>
