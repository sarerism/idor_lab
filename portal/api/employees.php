<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once '../config.php';

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all employees
    if (!isset($_GET['id'])) {
        $query = "SELECT employee_id, full_name, email, department, role, manager_name FROM employees ORDER BY full_name";
        $result = $conn->query($query);
        
        $employees = [];
        while ($row = $result->fetch_assoc()) {
            $employees[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $employees]);
        exit;
    }
    
    // Get specific employee
    $employee_id = $_GET['id'];
    $stmt = $conn->prepare("SELECT employee_id, full_name, email, department, role, manager_name FROM employees WHERE employee_id = ?");
    $stmt->bind_param("s", $employee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $employee = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $employee]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Employee not found']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
