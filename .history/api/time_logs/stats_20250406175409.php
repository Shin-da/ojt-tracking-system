<?php
// Include database and helper functions
require_once '../includes/db_connect.php';
require_once '../includes/helpers.php';

// Set headers
setHeaders();

// Connect to the database
$database = new Database();
$conn = $database->getConnection();

// Get time log statistics
try {
    // Get total hours
    $query = "SELECT COALESCE(SUM(hours_worked), 0) as total_hours FROM time_logs";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalHours = $result['total_hours'] ? $result['total_hours'] : 0;
    
    // Get total days
    $query = "SELECT COUNT(DISTINCT date) as total_days FROM time_logs";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalDays = $result['total_days'] ? $result['total_days'] : 0;
    
    // Get hours per week
    $query = "SELECT 
                YEAR(date) as year, 
                WEEK(date, 1) as week, 
                SUM(hours_worked) as weekly_hours,
                MIN(date) as start_date,
                MAX(date) as end_date
              FROM time_logs 
              GROUP BY YEAR(date), WEEK(date, 1) 
              ORDER BY YEAR(date) DESC, WEEK(date, 1) DESC
              LIMIT 10";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $weeklyHours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get OJT progress
    $query = "SELECT value FROM settings WHERE key_name = 'required_hours'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $requiredHours = isset($result['value']) ? floatval($result['value']) : 600;
    
    $progressPercentage = ($totalHours / $requiredHours) * 100;
    
    // Get daily average
    $query = "SELECT AVG(hours_worked) as daily_average FROM time_logs";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $dailyAverage = $result['daily_average'] ? $result['daily_average'] : 0;
    
    // Get most recent log date
    $query = "SELECT MAX(date) as last_date FROM time_logs";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $lastDate = $result['last_date'] ? $result['last_date'] : null;
    
    // Get start date from settings
    $query = "SELECT value FROM settings WHERE key_name = 'ojt_start_date'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $startDate = isset($result['value']) ? $result['value'] : '2024-02-12';
    
    $stats = [
        'total_hours' => floatval($totalHours),
        'total_days' => intval($totalDays),
        'required_hours' => floatval($requiredHours),
        'progress_percentage' => min(100, floatval($progressPercentage)),
        'daily_average' => floatval($dailyAverage),
        'weekly_hours' => $weeklyHours,
        'last_log_date' => $lastDate,
        'start_date' => $startDate
    ];
    
    sendResponse(true, "Statistics retrieved successfully", $stats);
} catch(PDOException $e) {
    sendResponse(false, "Error retrieving statistics: " . $e->getMessage(), null, 500);
} 