<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the requested path
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Remove the base directory from the path if it exists
$baseDir = '/OJT%20TRACKER';
if (strpos($path, $baseDir) === 0) {
    $path = substr($path, strlen($baseDir));
}

// If the path is empty or just a slash, serve the React app
if ($path === '' || $path === '/') {
    // Check if the React build files exist
    if (file_exists(__DIR__ . '/dist/index.html')) {
        readfile(__DIR__ . '/dist/index.html');
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "React build files not found. Please run 'npm run build' first."
        ]);
    }
    exit();
}

// Handle API requests
if (strpos($path, '/api/') === 0) {
    // Remove /api/ from the path
    $apiPath = substr($path, 5);
    
    // Route to the appropriate API endpoint
    switch ($apiPath) {
        case '/documents':
            require __DIR__ . '/api/documents/index.php';
            break;
        case '/documents/upload':
            require __DIR__ . '/api/documents/upload.php';
            break;
        case '/documents/download':
            require __DIR__ . '/api/documents/download.php';
            break;
        default:
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "API endpoint not found"
            ]);
    }
    exit();
}

// If no matching route is found, serve the React app
if (file_exists(__DIR__ . '/dist/index.html')) {
    readfile(__DIR__ . '/dist/index.html');
} else {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "React build files not found. Please run 'npm run build' first."
    ]);
} 