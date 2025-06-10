<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../includes/database.php';

class DocumentController {
    private $conn;
    private $upload_dir = '../uploads/documents/';

    public function __construct($db) {
        $this->conn = $db;
        if (!file_exists($this->upload_dir)) {
            mkdir($this->upload_dir, 0777, true);
        }
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->sendResponse(false, 'Method not allowed', null, 405);
        }

        try {
            if (!isset($_FILES['file'])) {
                return $this->sendResponse(false, 'No file uploaded', null, 400);
            }

            $file = $_FILES['file'];
            $title = $_POST['title'] ?? '';
            $description = $_POST['description'] ?? '';
            $category = $_POST['category'] ?? 'other';
            $user_id = $_POST['user_id'] ?? 1; // Default to 1 for now, should be from auth

            // Validate file
            $allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!in_array($file['type'], $allowed_types)) {
                return $this->sendResponse(false, 'Invalid file type', null, 400);
            }

            // Generate unique filename
            $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $unique_filename = uniqid() . '_' . time() . '.' . $file_extension;
            $file_path = $this->upload_dir . $unique_filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $file_path)) {
                return $this->sendResponse(false, 'Failed to save file', null, 500);
            }

            // Save to database
            $query = "INSERT INTO documents (user_id, title, description, file_path, file_type, file_size, category) 
                     VALUES (:user_id, :title, :description, :file_path, :file_type, :file_size, :category)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':file_path', $unique_filename);
            $stmt->bindParam(':file_type', $file['type']);
            $stmt->bindParam(':file_size', $file['size']);
            $stmt->bindParam(':category', $category);

            if ($stmt->execute()) {
                return $this->sendResponse(true, 'Document uploaded successfully', [
                    'id' => $this->conn->lastInsertId(),
                    'title' => $title,
                    'file_path' => $unique_filename
                ]);
            }

            return $this->sendResponse(false, 'Failed to save document info', null, 500);

        } catch (Exception $e) {
            return $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    public function read() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            return $this->sendResponse(false, 'Method not allowed', null, 405);
        }

        try {
            $user_id = $_GET['user_id'] ?? 1; // Default to 1 for now, should be from auth
            $category = $_GET['category'] ?? null;

            $query = "SELECT * FROM documents WHERE user_id = :user_id";
            if ($category) {
                $query .= " AND category = :category";
            }
            $query .= " ORDER BY created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            if ($category) {
                $stmt->bindParam(':category', $category);
            }
            $stmt->execute();

            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $this->sendResponse(true, 'Documents retrieved successfully', $documents);

        } catch (Exception $e) {
            return $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            return $this->sendResponse(false, 'Method not allowed', null, 405);
        }

        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                return $this->sendResponse(false, 'Document ID is required', null, 400);
            }

            // Get file path before deleting
            $query = "SELECT file_path FROM documents WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $document = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$document) {
                return $this->sendResponse(false, 'Document not found', null, 404);
            }

            // Delete file
            $file_path = $this->upload_dir . $document['file_path'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }

            // Delete from database
            $query = "DELETE FROM documents WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                return $this->sendResponse(true, 'Document deleted successfully', null);
            }

            return $this->sendResponse(false, 'Failed to delete document', null, 500);

        } catch (Exception $e) {
            return $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    private function sendResponse($success, $message, $data, $status_code = 200) {
        http_response_code($status_code);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
}

// Initialize controller
$database = new Database();
$db = $database->getConnection();
$controller = new DocumentController($db);

// Route requests
$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {
    case 'POST':
        $controller->create();
        break;
    case 'GET':
        $controller->read();
        break;
    case 'DELETE':
        $controller->delete();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?> 