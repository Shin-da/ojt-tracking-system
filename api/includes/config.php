<?php
// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/../.env')) {
    $env = parse_ini_file(__DIR__ . '/../.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Database configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'ojt_tracker');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');

// JWT configuration
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'your-secret-key-here');
define('JWT_EXPIRATION', $_ENV['JWT_EXPIRATION'] ?? 86400); // 24 hours in seconds

// CORS configuration
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
]);

// File upload configuration
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
]);

// Rate limiting configuration
define('RATE_LIMIT', 100); // requests per minute
define('RATE_LIMIT_WINDOW', 60); // 1 minute in seconds

// Error reporting
if ($_ENV['APP_ENV'] === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Manila'); 