<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database and necessary files
include_once '../includes/database.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

try {
    // Get total hours
    $totalHoursQuery = "SELECT SUM(hours_worked) as total_hours FROM time_logs";
    $totalHoursStmt = $db->prepare($totalHoursQuery);
    $totalHoursStmt->execute();
    $totalHoursRow = $totalHoursStmt->fetch(PDO::FETCH_ASSOC);
    $totalHours = $totalHoursRow['total_hours'] ?: 0;

    // Get total days
    $totalDaysQuery = "SELECT COUNT(DISTINCT date) as total_days FROM time_logs";
    $totalDaysStmt = $db->prepare($totalDaysQuery);
    $totalDaysStmt->execute();
    $totalDaysRow = $totalDaysStmt->fetch(PDO::FETCH_ASSOC);
    $totalDays = $totalDaysRow['total_days'] ?: 0;
    
    // Get daily average hours
    $dailyAverage = $totalDays > 0 ? $totalHours / $totalDays : 0;

    // Get weekly hours
    $weeklyHoursQuery = "SELECT 
                          YEAR(date) as year,
                          WEEK(date) as week,
                          SUM(hours_worked) as weekly_hours
                        FROM 
                          time_logs
                        GROUP BY 
                          YEAR(date), WEEK(date)
                        ORDER BY 
                          YEAR(date) DESC, WEEK(date) DESC
                        LIMIT 10";
    $weeklyHoursStmt = $db->prepare($weeklyHoursQuery);
    $weeklyHoursStmt->execute();
    $weeklyHours = $weeklyHoursStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get monthly hours
    $monthlyHoursQuery = "SELECT 
                          YEAR(date) as year,
                          MONTH(date) as month,
                          SUM(hours_worked) as monthly_hours,
                          COUNT(DISTINCT date) as days_logged
                        FROM 
                          time_logs
                        GROUP BY 
                          YEAR(date), MONTH(date)
                        ORDER BY 
                          YEAR(date) DESC, MONTH(date) DESC
                        LIMIT 12";
    $monthlyHoursStmt = $db->prepare($monthlyHoursQuery);
    $monthlyHoursStmt->execute();
    $monthlyHours = $monthlyHoursStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get the last log date
    $lastLogQuery = "SELECT date FROM time_logs ORDER BY date DESC LIMIT 1";
    $lastLogStmt = $db->prepare($lastLogQuery);
    $lastLogStmt->execute();
    $lastLogRow = $lastLogStmt->fetch(PDO::FETCH_ASSOC);
    $lastLogDate = $lastLogRow ? $lastLogRow['date'] : null;

    // Get the first log date (start date)
    $startDateQuery = "SELECT date FROM time_logs ORDER BY date ASC LIMIT 1";
    $startDateStmt = $db->prepare($startDateQuery);
    $startDateStmt->execute();
    $startDateRow = $startDateStmt->fetch(PDO::FETCH_ASSOC);
    $startDate = $startDateRow ? $startDateRow['date'] : '2024-02-12'; // Default if no logs

    // Get required hours from settings
    $requiredHoursQuery = "SELECT value FROM settings WHERE key_name = 'required_hours'";
    $requiredHoursStmt = $db->prepare($requiredHoursQuery);
    $requiredHoursStmt->execute();
    $requiredHoursRow = $requiredHoursStmt->fetch(PDO::FETCH_ASSOC);
    $requiredHours = $requiredHoursRow ? (float)$requiredHoursRow['value'] : 500;

    // Calculate progress percentage
    $progressPercentage = ($totalHours / $requiredHours) * 100;
    
    // Get all dates with hours for heatmap
    $heatmapQuery = "SELECT date, hours_worked FROM time_logs ORDER BY date ASC";
    $heatmapStmt = $db->prepare($heatmapQuery);
    $heatmapStmt->execute();
    $heatmapData = $heatmapStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get frequent tasks from notes
    $notesQuery = "SELECT notes FROM time_logs WHERE notes IS NOT NULL AND notes != '' ORDER BY date DESC";
    $notesStmt = $db->prepare($notesQuery);
    $notesStmt->execute();
    $notesData = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group notes content for task analysis
    $notesContent = [];
    foreach ($notesData as $note) {
        if (!empty($note['notes'])) {
            $notesContent[] = $note['notes'];
        }
    }

    // Create response
    $response = array(
        "success" => true,
        "data" => array(
            "total_hours" => (float)$totalHours,
            "total_days" => (int)$totalDays,
            "required_hours" => (float)$requiredHours,
            "progress_percentage" => (float)$progressPercentage,
            "daily_average" => (float)$dailyAverage,
            "weekly_hours" => $weeklyHours,
            "monthly_hours" => $monthlyHours,
            "last_log_date" => $lastLogDate,
            "start_date" => $startDate,
            "heatmap_data" => $heatmapData,
            "notes_data" => $notesContent
        )
    );

    // Output the response
    http_response_code(200);
    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Error retrieving statistics: " . $e->getMessage()
    ));
}
?> 