<?php
// Connect to the database
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'ojt_tracker';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully\n\n";
    
    // Get table names
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tables in database:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
        
        // Get column information
        $columns = $conn->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $column) {
            echo "  * {$column['Field']} ({$column['Type']})\n";
        }
        
        // Get row count
        $countStmt = $conn->query("SELECT COUNT(*) FROM $table");
        $rowCount = $countStmt->fetchColumn();
        echo "  * Rows: $rowCount\n";
        
        // Get sample data if rows exist
        if ($rowCount > 0) {
            $sampleData = $conn->query("SELECT * FROM $table LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            echo "  * Sample data: " . json_encode($sampleData, JSON_PRETTY_PRINT) . "\n";
        }
        
        echo "\n";
    }
    
    // Check API connectivity
    echo "Testing API endpoint...\n";
    $apiEndpoint = "http://localhost/OJT%20TRACKER/api/time_logs/stats.php";
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true
        ]
    ]);
    
    $response = @file_get_contents($apiEndpoint, false, $context);
    if ($response === FALSE) {
        echo "API endpoint not reachable: $apiEndpoint\n";
    } else {
        $data = json_decode($response, true);
        echo "API response (success): " . ($data['success'] ? 'true' : 'false') . "\n";
        if (!empty($data['message'])) {
            echo "API message: " . $data['message'] . "\n";
        }
    }
    
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
} 