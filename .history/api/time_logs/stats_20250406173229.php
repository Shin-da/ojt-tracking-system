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
    $query = "SELECT SUM(hours_worked) as total_hours FROM time_logs";
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
                WEEK(date) as week, 
                SUM(hours_worked) as weekly_hours 
              FROM time_logs 
              GROUP BY YEAR(date), WEEK(date) 
              ORDER BY YEAR(date) DESC, WEEK(date) DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $weeklyHours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get OJT progress
    $query = "SELECT value FROM settings WHERE key_name = 'required_hours'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $requiredHours = isset($result['value']) ? $result['value'] : 600;
    
    $progressPercentage = ($totalHours / $requiredHours) * 100;
    
    $stats = [
        'total_hours' => $totalHours,
        'total_days' => $totalDays,
        'required_hours' => $requiredHours,
        'progress_percentage' => min(100, $progressPercentage),
        'weekly_hours' => $weeklyHours
    ];
    
    sendResponse(true, "Statistics retrieved successfully", $stats);
} catch(PDOException $e) {
    sendResponse(false, "Error retrieving statistics: " . $e->getMessage(), null, 500);
} 