<?php
// Buffer output to prevent any unwanted characters in JSON response
ob_start();

// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database connection
require_once __DIR__ . '/../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // GET request - Fetch holidays
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "SELECT * FROM holidays";
        $params = array();
        
        // Handle date range filtering
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            $query .= " WHERE date BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $_GET['start_date'];
            $params[':end_date'] = $_GET['end_date'];
        }
        
        // Always order by date
        $query .= " ORDER BY date ASC";

        $stmt = $db->prepare($query);
        
        // Bind parameters
        foreach ($params as $key => &$value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $holidays = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Clear any buffered output
        ob_clean();
        
        echo json_encode([
            "success" => true,
            "data" => $holidays
        ]);
    } else {
        throw new Exception("Invalid request method");
    }

} catch (Exception $e) {
    // Clear any buffered output
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 