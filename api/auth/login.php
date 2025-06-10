<?php
// Enable error reporting for development
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../includes/cors.php';  // Add CORS support
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

// Set content type
header('Content-Type: application/json');

try {
    // Get JSON input
    $data = getJsonInput();
    
    // Validate required fields
    if (!validateRequiredFields($data, ['username', 'password'])) {
        sendResponse(false, "Username and password are required", null, 400);
    }
    
    // Initialize auth
    $auth = new Auth();
    
    // Attempt login
    $result = $auth->login($data['username'], $data['password']);
    
    if ($result['success']) {
        sendResponse(true, $result['message'], $result['data']);
    } else {
        sendResponse(false, $result['message'], null, 401);
    }
} catch (Exception $e) {
    sendResponse(false, "Login failed: " . $e->getMessage(), null, 500);
} 