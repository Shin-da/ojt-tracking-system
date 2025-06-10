<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/helpers.php';

// Set headers and handle preflight
setHeaders();

try {
    // Get JSON input
    $data = getJsonInput();
    
    // Validate required fields
    if (!validateRequiredFields($data, ['username', 'password', 'full_name', 'email'])) {
        sendResponse(false, "All fields are required", null, 400);
    }
    
    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, "Invalid email format", null, 400);
    }
    
    // Validate password strength
    if (strlen($data['password']) < 8) {
        sendResponse(false, "Password must be at least 8 characters long", null, 400);
    }
    
    // Initialize auth
    $auth = new Auth();
    
    // Attempt registration
    $result = $auth->register(
        $data['username'],
        $data['password'],
        $data['full_name'],
        $data['email']
    );
    
    if ($result['success']) {
        sendResponse(true, $result['message']);
    } else {
        sendResponse(false, $result['message'], null, 400);
    }
} catch (Exception $e) {
    sendResponse(false, "Registration failed: " . $e->getMessage(), null, 500);
} 