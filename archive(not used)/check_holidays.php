<?php
require_once __DIR__ . '/api/includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT * FROM holidays ORDER BY date";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    echo "<pre>";
    echo "Number of holidays found: " . $stmt->rowCount() . "\n\n";
    echo "Holidays:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
    }
    echo "</pre>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?> 