<?php
error_reporting(0);
session_start();

// Process login BEFORE any HTML output
$error_message = '';
if (isset($_POST['login'])) {
    require_once 'config.php';
    
    $employee_id = $_POST['employee_id'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($employee_id) || empty($password)) {
        $error_message = 'Username and password are required.';
    } else {
        // Vulnerable: MD5 password hashing
        $password_hash = md5($password);
        
        $stmt = $conn->prepare("SELECT * FROM employees WHERE employee_id = ? AND password_hash = ?");
        $stmt->bind_param("ss", $employee_id, $password_hash);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $_SESSION['logged_in'] = true;
            $_SESSION['employee_id'] = $user['employee_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['department'] = $user['department'];
            $_SESSION['role'] = $user['role'];
            
            // REDIRECT WITH UID PARAMETER (full employee ID - IDOR vulnerability)
            // report_id will only appear when user clicks on Reports page
            header('Location: dashboard.php?uid=' . $user['employee_id']);
            exit();
        } else {
            $error_message = 'Invalid employee ID or password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MBTI Employee Portal - Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
        }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #00447c 0%, #2d2926 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
        }
        
        .login-container {
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 450px;
            width: 100%;
            position: relative;
        }
        
        .portal-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .portal-logo {
            width: 60px;
            height: auto;
            margin-bottom: 1rem;
        }
        
        .portal-header h1 {
            color: #2d2926;
            font-size: 1.8rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
        }
        
        .portal-header p {
            color: #666;
            font-size: 0.95rem;
        }
        
        .help-notice {
            background: #f0f8ff;
            border-left: 4px solid #00adef;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #333;
        }
        
        .help-notice a {
            color: #00adef;
            text-decoration: none;
            font-weight: 600;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 0.9rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #00adef;
        }
        
        .form-group input::placeholder {
            color: #999;
        }
        
        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .remember-me input {
            margin-right: 0.5rem;
        }
        
        .remember-me label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .login-button {
            width: 100%;
            padding: 1rem;
            background: #00adef;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .login-button:hover {
            background: #00447c;
        }
        
        .form-links {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.9rem;
        }
        
        .form-links a {
            color: #00adef;
            text-decoration: none;
            margin: 0 0.5rem;
        }
        
        .form-links a:hover {
            text-decoration: underline;
        }
        
        .error-message {
            background: #fee;
            border-left: 4px solid #c33;
            padding: 1rem;
            margin-bottom: 1.5rem;
            color: #c33;
            font-size: 0.9rem;
        }
        
        .back-link {
            text-align: center;
            margin-top: 2rem;
        }
        
        .back-link a {
            color: #666;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .back-link a:hover {
            color: #00adef;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="portal-header">
            <img src="../images/mercedes-logo.png" alt="Mercedes-Benz" class="portal-logo">
            <h1>Employee Portal</h1>
            <p>Please log in with your employee credentials</p>
        </div>
        
        <?php if (!empty($error_message)): ?>
            <div class="error-message"><?php echo htmlspecialchars($error_message); ?></div>
        <?php endif; ?>
        
        <form method="POST">
            <div class="form-group">
                <label for="employee_id">Employee ID</label>
                <input type="text" id="employee_id" name="employee_id" placeholder="Enter your employee ID (e.g., MBTI2024XXX)" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>
            
            <div class="remember-me">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">Remember me</label>
            </div>
            
            <button type="submit" name="login" class="login-button">
                Log In →
            </button>
            
            <div class="form-links">
                <a href="forgot.php">Forgot Password</a>
            </div>
        </form>
        
        <div class="back-link">
            <a href="../">← Back to Homepage</a>
        </div>
    </div>
</body>
</html>
