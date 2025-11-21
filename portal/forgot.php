<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MBTI Portal - Forgot Password</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #00447c 0%, #2d2926 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .forgot-container {
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 450px;
            width: 90%;
        }
        h1 { color: #2d2926; font-size: 1.8rem; font-weight: 300; margin-bottom: 1rem; text-align: center; }
        p { color: #666; margin-bottom: 2rem; text-align: center; }
        .info-notice {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #856404;
        }
        .success-notice {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #155724;
        }
        input {
            width: 100%;
            padding: 0.9rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            margin-bottom: 1.5rem;
        }
        button {
            width: 100%;
            padding: 1rem;
            background: #00adef;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
        }
        button:hover { background: #00447c; }
        .back-link { text-align: center; margin-top: 1.5rem; }
        .back-link a { color: #00adef; text-decoration: none; }
    </style>
</head>
<body>
    <div class="forgot-container">
        <h1>Student Portal</h1>
        <p>Enter your employee ID and we will email a reset link to you.</p>
        
        <?php
        if (isset($_POST['submit'])) {
            require_once 'config.php';
            
            $employee_id = $_POST['employee_id'] ?? '';
            
            if (empty($employee_id)) {
                echo '<div class="info-notice">⚠️ Please fill in this field.</div>';
            } else {
                // Check if user exists (INFORMATION DISCLOSURE!)
                $stmt = $conn->prepare("SELECT email FROM employees WHERE employee_id = ?");
                $stmt->bind_param("s", $employee_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                // Always show success message (but actual behavior reveals user existence)
                echo '<div class="success-notice">✓ If the employee exists, an email has been sent with reset instructions.</div>';
                
                // In a real vulnerable app, you might see different messages:
                // if ($result->num_rows > 0) {
                //     echo "Email sent to registered address";
                // } else {
                //     echo "User not found"; // <- This would be user enumeration!
                // }
            }
        }
        ?>
        
        <form method="POST">
            <label for="employee_id">Employee ID</label>
            <input type="text" id="employee_id" name="employee_id" placeholder="Enter your Employee ID (e.g., MB2024001)" required>
            
            <button type="submit" name="submit">Submit →</button>
        </form>
        
        <div class="back-link">
            <a href="login.php">← Back to Login</a>
        </div>
    </div>
</body>
</html>
