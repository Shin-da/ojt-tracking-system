<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    // Check if file was uploaded
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['file'];
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? 'other';
    $notes = $_POST['description'] ?? ''; // Changed from notes to description to match frontend
    $user_id = $_POST['user_id'] ?? 1;
    $status = 'pending';

    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload failed with error code: ' . $file['error']);
    }

    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '.' . $fileExtension;
    $filePath = $uploadDir . $fileName;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Insert into database
    $query = "INSERT INTO documents (user_id, title, file_name, file_path, category, status, notes) 
              VALUES (:user_id, :title, :file_name, :file_path, :category, :status, :notes)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':file_name', $file['name']);
    $stmt->bindParam(':file_path', $filePath);
    $stmt->bindParam(':category', $category);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':notes', $notes);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Document uploaded successfully",
            "data" => [
                "id" => $db->lastInsertId(),
                "title" => $title,
                "file_name" => $file['name'],
                "category" => $category,
                "status" => $status
            ]
        ]);
    } else {
        throw new Exception('Failed to save document to database');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to upload document: " . $e->getMessage()
    ]);
} 