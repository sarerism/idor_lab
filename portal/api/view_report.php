<?php
session_start();
require_once '../config.php';


if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}


if (!isset($_GET['file_id'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File ID required']);
    exit;
}

$file_id = $_GET['file_id'];


if (!ctype_xdigit($file_id)) {
     http_response_code(400);
     header('Content-Type: application/json');
     echo json_encode(['success' => false, 'message' => 'Invalid File ID format']);
     exit;
}

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


if ($file_info['employee_id'] !== $_SESSION['employee_id']) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Access denied. You can only view your own reports.']);
    exit;
}


$upload_dir = dirname(__DIR__) . '/uploads/reports/';
$filepath = $upload_dir . $file_info['filename'];


$real_filepath = realpath($filepath);
$real_upload_dir = realpath($upload_dir);


if ($real_filepath === false || strpos($real_filepath, $real_upload_dir) !== 0 || !file_exists($real_filepath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File not found on disk']);
    exit;
}


header('Content-Type: application/pdf');

header('Content-Disposition: attachment; filename="' . basename($file_info['filename']) . '"');
header('Content-Length: ' . filesize($real_filepath));
header('Cache-Control: private, max-age=0, must-revalidate');
header('Pragma: public');


readfile($real_filepath);
exit;
