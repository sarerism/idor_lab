<?php
session_start();
require_once '../config.php';

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get file_id from URL parameter
if (!isset($_GET['file_id'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File ID required']);
    exit;
}

$file_id = $_GET['file_id'];

// Lookup file in database
$stmt = $conn->prepare("SELECT employee_id, filename, file_size FROM report_uploads WHERE file_id = ?");
$stmt->bind_param("s", $file_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

$file_info = $result->fetch_assoc();
$stmt->close();

// Authorization check: Users can only view their own reports
if ($file_info['employee_id'] !== $_SESSION['employee_id']) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Access denied. You can only view your own reports.']);
    exit;
}

$upload_dir = '/var/www/portal/uploads/reports/';
$filepath = $upload_dir . $file_info['filename'];

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File not found on disk']);
    exit;
}

// Serve the PDF file
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . basename($file_info['filename']) . '"');
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: private, max-age=0, must-revalidate');
header('Pragma: public');

readfile($filepath);
exit;
