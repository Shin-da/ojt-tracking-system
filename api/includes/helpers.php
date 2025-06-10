<?php
// Disable error display
ini_set('display_errors', 0);
error_reporting(0);

// Set error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server Error: ' . $errstr,
        'data' => null
    ]);
    exit;
});

// Set exception handler
set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server Error: ' . $e->getMessage(),
        'data' => null
    ]);
    exit;
});

// Set response headers
function setHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Read JSON input
function getJsonInput() {
    $input = file_get_contents("php://input");
    if (!$input) {
        sendResponse(false, "No input data provided", null, 400);
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, "Invalid JSON input: " . json_last_error_msg(), null, 400);
    }
    
    return $data;
}

// Send JSON response
function sendResponse($success, $message, $data = null, $code = 200) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Validate required fields
function validateRequiredFields($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return false;
        }
    }
    return true;
} 