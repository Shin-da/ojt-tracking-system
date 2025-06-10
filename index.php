<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

// Handle static files
if (strpos($path, '/assets/') === 0) {
    $file = __DIR__ . '/dist' . $path;
    if (file_exists($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimeTypes = [
            'js' => 'text/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf'
        ];
        
        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
            header('X-Content-Type-Options: nosniff');
            // Add cache control headers
            header('Cache-Control: max-age=31536000, immutable');
            readfile($file);
            exit();
        }
    }
}

// Handle API requests
if (strpos($path, '/api/') === 0) {
    header('Content-Type: application/json');
    require __DIR__ . $path;
    exit();
}

// For all other routes, serve the React app
$indexFile = __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($indexFile);
} else {
    http_response_code(404);
    echo "React app not built. Please run 'npm run build' first.";
} 