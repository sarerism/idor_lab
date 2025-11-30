<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Login
if ($method === 'POST' && !isset($_GET['action'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $employee_id = $data['employee_id'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($employee_id) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Employee ID and password are required']);
        exit;
    }
    
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
        
        echo json_encode([
            'success' => true,
            'user' => [
                'employee_id' => $user['employee_id'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'department' => $user['department'],
                'role' => $user['role']
            ],
            'token' => session_id()
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    exit;
}

// Check session
if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        echo json_encode([
            'success' => true,
            'user' => [
                'employee_id' => $_SESSION['employee_id'],
                'full_name' => $_SESSION['full_name'],
                'email' => $_SESSION['email'],
                'department' => $_SESSION['department'],
                'role' => $_SESSION['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    }
    exit;
}

// Logout
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
