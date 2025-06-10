<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../includes/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get the user ID from the request
    $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

    if (!$userId) {
        throw new Exception("User ID is required");
    }

    // Get time logs for the user
    $query = "SELECT 
                tl.*,
                DATE_FORMAT(tl.date, '%Y-%m-%d') as formatted_date,
                DATE_FORMAT(tl.time_in, '%H:%i') as formatted_time_in,
                DATE_FORMAT(tl.time_out, '%H:%i') as formatted_time_out
              FROM time_logs tl
              WHERE tl.user_id = :user_id
              ORDER BY tl.date DESC, tl.time_in DESC";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();

    $timeLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total hours and progress
    $query = "SELECT 
                SUM(hours_worked) as total_hours,
                COUNT(DISTINCT date) as total_days,
                MIN(date) as first_log,
                MAX(date) as last_log
              FROM time_logs
              WHERE user_id = :user_id";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();

    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get required hours from settings
    $query = "SELECT required_hours FROM settings WHERE id = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    $requiredHours = $settings['required_hours'] ?? 400; // Default to 400 if not set
    $progress = ($stats['total_hours'] / $requiredHours) * 100;

    // Prepare the response
    $response = [
        "success" => true,
        "data" => [
            "timeLogs" => $timeLogs,
            "stats" => [
                "totalHours" => (float)$stats['total_hours'],
                "totalDays" => (int)$stats['total_days'],
                "firstLog" => $stats['first_log'],
                "lastLog" => $stats['last_log'],
                "requiredHours" => (float)$requiredHours,
                "progress" => round($progress, 2)
            ]
        ]
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} 