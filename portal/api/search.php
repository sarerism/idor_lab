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
    
    // VULNERABILITY: Blind SQL Injection
    // Query uses user input directly without escaping
    // Returns only boolean result (found/not found), making it a blind SQLi
    // This searches in a separate dev_environment database with credentials
    $query = "SELECT COUNT(*) as count FROM dev_environment.dev_credentials WHERE 
              service_name LIKE '%$search%' OR 
              username LIKE '%$search%' OR 
              access_level LIKE '%$search%' OR 
              notes LIKE '%$search%'";
    
    $result = $conn->query($query);
    
    if ($result) {
        $row = $result->fetch_assoc();
        $count = $row['count'];
        
        // Blind SQLi: Only returns true/false, no actual data
        // Attacker must use time-based or boolean-based techniques to extract data
        if ($count > 0) {
            echo json_encode([
                'success' => true,
                'found' => true,
                'message' => 'Results found'
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'found' => false,
                'message' => 'No results found'
            ]);
        }
    } else {
        // Don't reveal SQL errors - makes it truly blind
        echo json_encode([
            'success' => true,
            'found' => false,
            'message' => 'No results found'
        ]);
    }
    exit;
}

// If no search query provided
echo json_encode([
    'success' => false,
    'message' => 'Search query parameter "q" is required'
]);
