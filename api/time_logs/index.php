<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Buffer output to prevent any unwanted characters in JSON response
ob_start();

// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../includes/database.php';
require_once __DIR__ . '/../includes/middleware.php';
require_once __DIR__ . '/../includes/helpers.php';

// Set headers and handle preflight
setHeaders();

// Initialize middleware
$middleware = new Middleware();

try {
    // Authenticate request
    $middleware->authenticate();
    
    // Get authenticated user
    $user = $_REQUEST['user'];
    
    $database = new Database();
    $db = $database->getConnection();

    // GET request - Fetch time logs
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "SELECT * FROM time_logs WHERE user_id = :user_id";
        $params = [':user_id' => $user->id];
        
        // Handle date range filtering
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            $query .= " AND date BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $_GET['start_date'];
            $params[':end_date'] = $_GET['end_date'];
        }
        
        // Handle limit
        if (isset($_GET['limit'])) {
            $query .= " ORDER BY date DESC LIMIT :limit";
            $params[':limit'] = (int)$_GET['limit'];
        } else {
            $query .= " ORDER BY date DESC";
        }

        $stmt = $db->prepare($query);
        
        // Bind parameters
        foreach ($params as $key => &$value) {
            if ($key === ':limit') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        $stmt->execute();
        $time_logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Clear any buffered output
        ob_clean();
        
        sendResponse(true, "Time logs retrieved successfully", $time_logs);
    }
    
    // POST request - Add new time log
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        // Validate required fields
        $rules = [
            'date' => 'required',
            'timeIn' => 'required',
            'timeOut' => 'required'
        ];
        
        $errors = $middleware->validateInput($data, $rules);
        if (!empty($errors)) {
            sendResponse(false, "Validation failed", $errors, 400);
        }

        // Calculate hours worked
        $timeIn = strtotime($data['date'] . ' ' . $data['timeIn']);
        $timeOut = strtotime($data['date'] . ' ' . $data['timeOut']);
        $hoursWorked = ($timeOut - $timeIn) / 3600;

        // Deduct lunch break if included
        if (isset($data['includeLunchBreak']) && $data['includeLunchBreak']) {
            $lunchStart = strtotime($data['date'] . ' 12:00:00');
            $lunchEnd = strtotime($data['date'] . ' 13:00:00');
            
            if ($timeIn < $lunchEnd && $timeOut > $lunchStart) {
                $hoursWorked -= 1; // Deduct 1 hour for lunch
            }
        }

        // Set default location to on-site if not provided
        $location = isset($data['location']) ? $data['location'] : 'on-site';

        // Insert the time log
        $query = "INSERT INTO time_logs (user_id, date, time_in, time_out, hours_worked, location, notes) 
                 VALUES (:user_id, :date, :time_in, :time_out, :hours_worked, :location, :notes)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':user_id' => $user->id,
            ':date' => $data['date'],
            ':time_in' => $data['timeIn'],
            ':time_out' => $data['timeOut'],
            ':hours_worked' => $hoursWorked,
            ':location' => $location,
            ':notes' => $data['notes'] ?? null
        ]);

        // Clear any buffered output
        ob_clean();
        
        sendResponse(true, "Time log added successfully", [
            "id" => $db->lastInsertId()
        ]);
    }
    
    // DELETE request - Delete time log
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (!isset($_GET['id'])) {
            sendResponse(false, "ID parameter is required", null, 400);
        }

        // Verify that the time log belongs to the user
        $query = "SELECT id FROM time_logs WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        if ($stmt->rowCount() === 0) {
            sendResponse(false, "Time log not found or unauthorized", null, 404);
        }

        $query = "DELETE FROM time_logs WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        sendResponse(true, "Time log deleted successfully");
    }
    
    else {
        sendResponse(false, "Invalid request method", null, 405);
    }

} catch (Exception $e) {
    // Clear any buffered output
    ob_clean();
    
    error_log("Error in time_logs/index.php: " . $e->getMessage());
    
    sendResponse(false, $e->getMessage(), null, 500);
}
?> 