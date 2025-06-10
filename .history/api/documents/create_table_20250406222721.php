<?php
require_once __DIR__ . '/../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Drop table if exists
    $query = "DROP TABLE IF EXISTS documents";
    $stmt = $db->prepare($query);
    $stmt->execute();
    echo "Dropped existing documents table\n";

    // Create table
    $query = "CREATE TABLE documents (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'other',
        status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    )";
    
    $stmt = $db->prepare($query);
    if ($stmt->execute()) {
        echo "Documents table created successfully\n\n";
        
        // Show table structure
        $query = "DESCRIBE documents";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($structure);
    } else {
        throw new Exception("Failed to create documents table");
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 