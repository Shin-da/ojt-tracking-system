<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Buffer output to prevent any unwanted characters in JSON response
ob_start();

// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get total hours
    $totalHoursQuery = "SELECT COALESCE(SUM(hours_worked), 0) as total_hours FROM time_logs";
    $totalHoursStmt = $db->query($totalHoursQuery);
    $totalHours = $totalHoursStmt->fetch(PDO::FETCH_ASSOC)['total_hours'];

    // Get total days
    $totalDaysQuery = "SELECT COUNT(DISTINCT date) as total_days FROM time_logs";
    $totalDaysStmt = $db->query($totalDaysQuery);
    $totalDays = $totalDaysStmt->fetch(PDO::FETCH_ASSOC)['total_days'];

    // Calculate daily average
    $dailyAverage = $totalDays > 0 ? $totalHours / $totalDays : 0;

    // Get weekly hours for the last 4 weeks
    $weeklyHoursQuery = "
        SELECT 
            YEARWEEK(date, 1) as week,
            SUM(hours_worked) as weekly_hours
        FROM time_logs
        GROUP BY YEARWEEK(date, 1)
        ORDER BY week DESC
        LIMIT 4
    ";
    $weeklyHoursStmt = $db->query($weeklyHoursQuery);
    $weeklyHours = $weeklyHoursStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get required hours from settings
    $requiredHoursQuery = "SELECT value FROM settings WHERE key_name = 'required_hours'";
    $requiredHoursStmt = $db->query($requiredHoursQuery);
    $requiredHours = $requiredHoursStmt->fetch(PDO::FETCH_ASSOC);
    $requiredHours = $requiredHours ? (float)$requiredHours['value'] : 500;

    // Calculate progress percentage
    $progressPercentage = ($totalHours / $requiredHours) * 100;

    // Get last log date
    $lastLogQuery = "SELECT date FROM time_logs ORDER BY date DESC LIMIT 1";
    $lastLogStmt = $db->query($lastLogQuery);
    $lastLogDate = $lastLogStmt->fetch(PDO::FETCH_ASSOC);
    $lastLogDate = $lastLogDate ? $lastLogDate['date'] : null;

    // Get start date
    $startDateQuery = "SELECT date FROM time_logs ORDER BY date ASC LIMIT 1";
    $startDateStmt = $db->query($startDateQuery);
    $startDate = $startDateStmt->fetch(PDO::FETCH_ASSOC);
    $startDate = $startDate ? $startDate['date'] : date('Y-m-d');

    // Clear any buffered output
    ob_clean();

    echo json_encode([
        "success" => true,
        "data" => [
            "total_hours" => (float)$totalHours,
            "total_days" => (int)$totalDays,
            "required_hours" => (float)$requiredHours,
            "progress_percentage" => (float)$progressPercentage,
            "daily_average" => (float)$dailyAverage,
            "weekly_hours" => $weeklyHours,
            "last_log_date" => $lastLogDate,
            "start_date" => $startDate
        ]
    ]);

} catch (Exception $e) {
    // Clear any buffered output
    ob_clean();
    
    error_log("Error in time_logs/stats.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "file" => basename(__FILE__),
        "line" => $e->getLine()
    ]);
}
?> 