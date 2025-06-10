<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if file parameter is provided
if (!isset($_GET['file'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "File parameter is required"
    ]);
    exit();
}

$fileName = $_GET['file'];
$filePath = dirname(dirname(__DIR__)) . '/uploads/' . $fileName;

// Check if file exists
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "File not found"
    ]);
    exit();
}

// Get file extension
$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

// Set appropriate content type based on file extension
switch (strtolower($fileExtension)) {
    case 'pdf':
        header('Content-Type: application/pdf');
        break;
    case 'doc':
        header('Content-Type: application/msword');
        break;
    case 'docx':
        header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        break;
    case 'jpg':
    case 'jpeg':
        header('Content-Type: image/jpeg');
        break;
    case 'png':
        header('Content-Type: image/png');
        break;
    case 'gif':
        header('Content-Type: image/gif');
        break;
    default:
        header('Content-Type: application/octet-stream');
}

// Set headers for file download
header('Content-Disposition: inline; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: public, max-age=3600');

// Output file
readfile($filePath);
exit(); 