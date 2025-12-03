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

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['q'])) {
    $search = $_GET['q'];
    
    // VULNERABILITY: SQL Injection
    // The search parameter is directly concatenated into the SQL query
    // Allows UNION-based SQLi to extract data from dev_environment database
    $query = "SELECT employee_id, full_name, email, department, role, manager_name 
              FROM employees 
              WHERE CONCAT(employee_id, ' ', full_name, ' ', email, ' ', department) LIKE '%" . $search . "%'";
    
    // VULNERABILITY: No error handling - SQL errors cause 500 status
    // This allows blind SQL injection detection through error responses
    $result = $conn->query($query);
    
    if ($result) {
        $employees = [];
        while ($row = $result->fetch_assoc()) {
            $employees[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'found' => count($employees) > 0,
            'count' => count($employees),
            'employees' => $employees,
            'message' => count($employees) > 0 ? 'Found ' . count($employees) . ' employee(s)' : 'No results found'
        ]);
    } else {
        // Query failed - return 500 error
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database query failed'
        ]);
    }
    exit;
}

// If no search query provided
echo json_encode([
    'success' => false,
    'message' => 'Search query parameter "q" is required'
]);
