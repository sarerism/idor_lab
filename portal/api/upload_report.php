<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once '../config.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['pdf']) || !isset($_POST['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $employee_id = $_SESSION['employee_id'];

    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $employee_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid session ID format']);
        exit;
    }

    $file = $_FILES['pdf'];
    $title = trim($_POST['title']);

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File upload error']);
        exit;
    }

    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File too large (max 10MB)']);
        exit;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if ($mime_type !== 'application/pdf') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed']);
        exit;
    }

    $handle = fopen($file['tmp_name'], 'r');
    $header = fread($handle, 5);
    fclose($handle);

    if ($header !== '%PDF-') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid PDF file']);
        exit;
    }

    $upload_dir = dirname(__DIR__) . '/uploads/reports/';
    
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    if (!file_exists($upload_dir . '.htaccess')) {
        file_put_contents($upload_dir . '.htaccess', "Deny from all");
    }

    $file_uuid = bin2hex(random_bytes(16));
    $safe_filename = $employee_id . '_' . $file_uuid . '.pdf';
    $destination = $upload_dir . $safe_filename;

    if (move_uploaded_file($file['tmp_name'], $destination)) {

        chmod($destination, 0644);

        $stmt = $conn->prepare("INSERT INTO report_uploads (employee_id, file_id, title, filename, file_size, upload_date) VALUES (?, ?, ?, ?, ?, NOW())");
    
        $stmt->bind_param("ssssi", $employee_id, $file_uuid, $title, $safe_filename, $file['size']);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Report uploaded successfully!',
    
                'file_id' => $file_uuid,

                'view_url' => '/api/view_report.php?file_id=' . $file_uuid
            ]);
        } else {
            if (file_exists($destination)) {
                unlink($destination);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error']);
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save file']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
