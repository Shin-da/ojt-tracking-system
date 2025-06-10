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

    // GET request - Fetch tasks
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "SELECT * FROM tasks WHERE user_id = :user_id";
        $params = [':user_id' => $user->id];
        
        // Handle status filtering
        if (isset($_GET['status'])) {
            $query .= " AND status = :status";
            $params[':status'] = $_GET['status'];
        }
        
        // Handle date range filtering
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            $query .= " AND due_date BETWEEN :start_date AND :end_date";
            $params[':start_date'] = $_GET['start_date'];
            $params[':end_date'] = $_GET['end_date'];
        }
        
        // Handle limit
        if (isset($_GET['limit'])) {
            $query .= " ORDER BY due_date ASC LIMIT :limit";
            $params[':limit'] = (int)$_GET['limit'];
        } else {
            $query .= " ORDER BY due_date ASC";
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
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(true, "Tasks retrieved successfully", $tasks);
    }
    
    // POST request - Add new task
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        // Validate required fields
        $rules = [
            'title' => 'required',
            'description' => 'required',
            'due_date' => 'required'
        ];
        
        $errors = $middleware->validateInput($data, $rules);
        if (!empty($errors)) {
            sendResponse(false, "Validation failed", $errors, 400);
        }

        // Insert the task
        $query = "INSERT INTO tasks (user_id, title, description, due_date, status, priority) 
                 VALUES (:user_id, :title, :description, :due_date, :status, :priority)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':user_id' => $user->id,
            ':title' => $data['title'],
            ':description' => $data['description'],
            ':due_date' => $data['due_date'],
            ':status' => $data['status'] ?? 'pending',
            ':priority' => $data['priority'] ?? 'medium'
        ]);

        sendResponse(true, "Task added successfully", [
            "id" => $db->lastInsertId()
        ]);
    }
    
    // PUT request - Update task
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = getJsonInput();
        
        if (!isset($data['id'])) {
            sendResponse(false, "Task ID is required", null, 400);
        }

        // Verify that the task belongs to the user
        $query = "SELECT id FROM tasks WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $data['id'],
            ':user_id' => $user->id
        ]);

        if ($stmt->rowCount() === 0) {
            sendResponse(false, "Task not found or unauthorized", null, 404);
        }

        // Build update query dynamically based on provided fields
        $updateFields = [];
        $params = [':id' => $data['id'], ':user_id' => $user->id];
        
        $allowedFields = ['title', 'description', 'due_date', 'status', 'priority'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($updateFields)) {
            sendResponse(false, "No fields to update", null, 400);
        }

        $query = "UPDATE tasks SET " . implode(', ', $updateFields) . 
                 " WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        sendResponse(true, "Task updated successfully");
    }
    
    // DELETE request - Delete task
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (!isset($_GET['id'])) {
            sendResponse(false, "ID parameter is required", null, 400);
        }

        // Verify that the task belongs to the user
        $query = "SELECT id FROM tasks WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        if ($stmt->rowCount() === 0) {
            sendResponse(false, "Task not found or unauthorized", null, 404);
        }

        $query = "DELETE FROM tasks WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $_GET['id'],
            ':user_id' => $user->id
        ]);

        sendResponse(true, "Task deleted successfully");
    }
    
    else {
        sendResponse(false, "Invalid request method", null, 405);
    }

} catch (Exception $e) {
    error_log("Error in tasks/index.php: " . $e->getMessage());
    sendResponse(false, $e->getMessage(), null, 500);
} 