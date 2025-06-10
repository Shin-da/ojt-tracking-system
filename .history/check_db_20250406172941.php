<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'ojt_tracker';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully\n";

    // Get all tables
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\nTables in database:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
        
        // Get table structure
        $stmt = $conn->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $column) {
            echo "  * {$column['Field']} ({$column['Type']})\n";
        }
        echo "\n";
    }
    
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
} 