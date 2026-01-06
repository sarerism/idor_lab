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

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $report_id = intval($_GET['id']);
    
    // Secure: Authorization check enforced
    $stmt = $conn->prepare("
        SELECT id, employee_id, employee_name, report_title, report_content,
               is_confidential, submitted_at, status, reviewed_at
        FROM weekly_reports 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $report_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $report = $result->fetch_assoc();

        // COPR01: Enforce access control
        if ($report['employee_id'] !== $_SESSION['employee_id']) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized access to report'
            ]);
            exit;
        }
        
        // Return full report content
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $report['id'],
                'employee_id' => $report['employee_id'],
                'employee_name' => $report['employee_name'],
                'report_title' => $report['report_title'],
                'report_content' => $report['report_content'],
                'is_confidential' => (bool)$report['is_confidential'],
                'submitted_at' => $report['submitted_at'],
                'status' => $report['status'],
                'reviewed_at' => $report['reviewed_at']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Report not found'
        ]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Report not found']);
