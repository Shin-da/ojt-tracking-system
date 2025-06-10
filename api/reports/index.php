<?php
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

    // GET request - Fetch reports
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "SELECT * FROM reports WHERE user_id = :user_id";
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
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(true, "Reports retrieved successfully", $reports);
    }
    
    // POST request - Add new report
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        // Validate required fields
        $rules = [
            'date' => 'required',
            'content' => 'required'
        ];
        
        $errors = $middleware->validateInput($data, $rules);
        if (!empty($errors)) {
            sendResponse(false, "Validation failed", $errors, 400);
        }

        // Insert the report
        $query = "INSERT INTO reports (user_id, date, content) 
                 VALUES (:user_id, :date, :content)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':user_id' => $user->id,
            ':date' => $data['date'],
            ':content' => $data['content']
        ]);

        sendResponse(true, "Report added successfully", [
            "id" => $db->lastInsertId()
        ]);
    }
    
    // PUT request - Update report
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = getJsonInput();
        
        if (!isset($data['id'])) {
            sendResponse(false, "Report ID is required", null, 400);
        }

        // Verify that the report belongs to the user
        $query = "SELECT id FROM reports WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $data['id'],
            ':user_id' => $user->id
        ]);

        if ($stmt->rowCount() === 0) {
            sendResponse(false, "Report not found or unauthorized", null, 404);
        }

        // Build update query dynamically based on provided fields
        $updateFields = [];
        $params = [':id' => $data['id'], ':user_id' => $user->id];
        
        $allowedFields = ['date', 'content'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($updateFields)) {
            sendResponse(false, "No fields to update", null, 400);
        }

        $query = "UPDATE reports SET " . implode(', ', $updateFields) . 
                 " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        sendResponse(true, "Report updated successfully");
    }
    
    // DELETE request - Delete report
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (!isset($_GET['id'])) {
            sendResponse(false, "ID parameter is required", null, 400);
        }

        // Verify that the report belongs to the user
        $query = "SELECT id FROM reports WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        if ($stmt->rowCount() === 0) {
            sendResponse(false, "Report not found or unauthorized", null, 404);
        }

        $query = "DELETE FROM reports WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        sendResponse(true, "Report deleted successfully");
    }
    
    else {
        sendResponse(false, "Invalid request method", null, 405);
    }

} catch (Exception $e) {
    error_log("Error in reports/index.php: " . $e->getMessage());
    sendResponse(false, $e->getMessage(), null, 500);
} 