<?php
define('DB_HOST', 'mbti_db');
define('DB_USER', 'mbti_admin');
define('DB_PASS', 'Training_DB_2024');
define('DB_NAME', 'mbti_employees');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
