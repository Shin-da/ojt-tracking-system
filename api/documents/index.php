<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Handle DELETE request
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (!isset($_GET['id'])) {
            throw new Exception('Document ID is required');
        }

        $id = $_GET['id'];
        
        // Get file path before deletion
        $query = "SELECT file_path FROM documents WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $filePath = $row['file_path'];
            
            // Delete from database
            $query = "DELETE FROM documents WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                // Delete file if it exists
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Document deleted successfully"
                ]);
            } else {
                throw new Exception('Failed to delete document');
            }
        } else {
            throw new Exception('Document not found');
        }
    }
    // Handle GET request
    else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $category = $_GET['category'] ?? 'all';
        $userId = $_GET['user_id'] ?? 1; // Default to user 1 if not specified
        
        $query = "SELECT * FROM documents WHERE user_id = :user_id";
        if ($category !== 'all') {
            $query .= " AND category = :category";
        }
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        if ($category !== 'all') {
            $stmt->bindParam(':category', $category);
        }
        
        $stmt->execute();
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => $documents
        ]);
    }
    else {
        throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 