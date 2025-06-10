<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
    $notes = $_POST['notes'] ?? '';
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
    $query = "INSERT INTO documents (title, file_name, file_path, status, notes) 
              VALUES (:title, :file_name, :file_path, :status, :notes)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':file_name', $fileName);
    $stmt->bindParam(':file_path', $filePath);
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
                "file_name" => $fileName,
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