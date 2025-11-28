<?php
// Database configuration - EXPOSED VIA .git or backup file!
define('DB_HOST', 'mbti_db');
define('DB_USER', 'portal_user');
define('DB_PASS', 'portal_pass');
define('DB_NAME', 'employee_portal');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
