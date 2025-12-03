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

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate required fields
    if (!isset($_FILES['pdf']) || !isset($_POST['title']) || !isset($_POST['employee_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    // Validate employee ID matches session
    if ($_POST['employee_id'] !== $_SESSION['employee_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $file = $_FILES['pdf'];
    $title = trim($_POST['title']);
    $employee_id = $_POST['employee_id'];

    // Validate file upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File upload error']);
        exit;
    }

    // Validate file size (10MB max)
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File too large (max 10MB)']);
        exit;
    }

    // Validate file type - SECURE validation
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if ($mime_type !== 'application/pdf') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed']);
        exit;
    }

    // Additional PDF validation - check file header
    $handle = fopen($file['tmp_name'], 'r');
    $header = fread($handle, 5);
    fclose($handle);

    if ($header !== '%PDF-') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid PDF file']);
        exit;
    }

    // Create secure upload directory if it doesn't exist
    $upload_dir = '/var/www/portal/uploads/reports/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // Generate secure filename with UUID
    $file_id = uniqid('report_', true);
    $safe_filename = preg_replace('/[^a-zA-Z0-9_-]/', '', $employee_id) . '_' . $file_id . '.pdf';
    $destination = $upload_dir . $safe_filename;

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        // Set secure permissions
        chmod($destination, 0644);

        // Log upload to database (rabbit hole - no actual vulnerability)
        $stmt = $conn->prepare("INSERT INTO report_uploads (employee_id, file_id, title, filename, file_size, upload_date) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("ssssi", $employee_id, $file_id, $title, $safe_filename, $file['size']);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Report uploaded successfully! File ID: uploads/' . $file_id,
                'file_id' => 'uploads/' . $file_id,
                'filename' => $safe_filename,
                'view_url' => '/reports?uid=' . $employee_id . '/uploads/' . $file_id . '.pdf'
            ]);
        } else {
            // Clean up file if database insert fails
            unlink($destination);
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
