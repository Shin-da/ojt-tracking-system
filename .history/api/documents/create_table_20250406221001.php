<?php
require_once '../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check if table exists
    $query = "SHOW TABLES LIKE 'documents'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // Create documents table
        $query = "CREATE TABLE documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            file_path VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            file_size INT NOT NULL,
            category VARCHAR(50) NOT NULL,
            version INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";

        $stmt = $db->prepare($query);
        if ($stmt->execute()) {
            echo "Documents table created successfully\n";
        } else {
            echo "Error creating documents table\n";
        }
    } else {
        echo "Documents table already exists\n";
    }

    // Check table structure
    $query = "DESCRIBE documents";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nTable structure:\n";
    print_r($columns);

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 