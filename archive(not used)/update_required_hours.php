<?php
// Include database connection
require_once 'api/includes/db_connect.php';

// Connect to the database
$database = new Database();
$conn = $database->getConnection();

try {
    // Check if the setting already exists
    $query = "SELECT id FROM settings WHERE key_name = 'required_hours'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        // Update existing setting
        $query = "UPDATE settings SET value = '500' WHERE key_name = 'required_hours'";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        echo "Required hours updated to 500 successfully.";
    } else {
        // Insert new setting
        $query = "INSERT INTO settings (key_name, value) VALUES ('required_hours', '500')";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        echo "Required hours setting created with value 500.";
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?> 