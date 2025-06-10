<?php
require_once __DIR__ . '/api/includes/auth.php';

try {
    $auth = new Auth();
    
    // Test user credentials
    $result = $auth->register(
        'testuser',
        'testpass123',
        'Test User',
        'test@example.com'
    );
    
    // Print the result
    header('Content-Type: application/json');
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 