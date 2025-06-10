<?php
// Disable error display
ini_set('display_errors', 0);
error_reporting(0);

// Load environment variables
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Buffer output to prevent any unwanted characters in JSON response
ob_start();

// Database Connection
class Database {
    private $host;
    private $user;
    private $pass;
    private $dbname;
    private $conn;

    public function __construct() {
        $this->host = 'localhost';
        $this->user = 'root';
        $this->pass = '';
        $this->dbname = 'ojt_tracker';
    }

    public function getConnection() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->dbname,
                $this->user,
                $this->pass
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $this->conn;
        } catch(PDOException $e) {
            // Clear any output that might have been generated
            ob_clean();
            
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Database connection failed: " . $e->getMessage()
            ]);
            exit();
        }
    }
} 