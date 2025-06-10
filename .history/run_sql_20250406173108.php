<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'ojt_tracker';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully\n";

    // Read the SQL file
    $sql = file_get_contents('fix_tables.sql');
    
    // Execute the SQL commands
    $conn->exec($sql);
    echo "SQL executed successfully\n";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
} 