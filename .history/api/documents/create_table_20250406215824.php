<?php
require_once '../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Create documents table
    $query = "CREATE TABLE IF NOT EXISTS documents (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";

    $stmt = $db->prepare($query);
    $stmt->execute();

    echo "Documents table created successfully";
} catch(PDOException $e) {
    echo "Error creating documents table: " . $e->getMessage();
}
?> 