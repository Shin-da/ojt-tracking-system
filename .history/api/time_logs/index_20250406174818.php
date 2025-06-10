<?php
// Include database and helper functions
require_once '../includes/db_connect.php';
require_once '../includes/helpers.php';

// Set headers
setHeaders();

// Connect to the database
$database = new Database();
$conn = $database->getConnection();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Process based on request method
switch ($method) {
    case 'GET':
        // Get time logs
        try {
            $query = "SELECT * FROM time_logs ORDER BY date DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse(true, "Time logs retrieved successfully", $logs);
        } catch(PDOException $e) {
            sendResponse(false, "Error retrieving time logs: " . $e->getMessage(), null, 500);
        }
        break;
        
    case 'POST':
        // Add new time log
        try {
            $data = getJsonInput();
            
            // Validate required fields
            if (!validateRequiredFields($data, ['date', 'timeIn', 'timeOut'])) {
                sendResponse(false, "Date, timeIn, and timeOut are required", null, 400);
            }
            
            // Calculate hours worked
            $timeIn = new DateTime($data['date'] . ' ' . $data['timeIn']);
            $timeOut = new DateTime($data['date'] . ' ' . $data['timeOut']);
            
            // Check if timeOut is after timeIn
            if ($timeOut <= $timeIn) {
                sendResponse(false, "Time out must be after time in", null, 400);
            }
            
            // Calculate interval
            $interval = $timeIn->diff($timeOut);
            $hoursWorked = $interval->h + ($interval->i / 60);
            
            // Deduct lunch break if option is selected and time spans across lunch hour
            $includeLunchBreak = isset($data['includeLunchBreak']) ? $data['includeLunchBreak'] : false;
            $lunchDeduction = 0;
            
            if ($includeLunchBreak) {
                $morningHour = (int)$timeIn->format('H');
                $afternoonHour = (int)$timeOut->format('H');
                
                // If time span crosses noon (12pm-1pm), deduct 1 hour for lunch
                if ($morningHour < 12 && $afternoonHour >= 13) {
                    $lunchDeduction = 1;
                    $hoursWorked -= $lunchDeduction;
                }
            }
            
            // Insert into database
            $query = "INSERT INTO time_logs (date, time_in, time_out, hours_worked, notes) 
                      VALUES (:date, :time_in, :time_out, :hours_worked, :notes)";
            $stmt = $conn->prepare($query);
            
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':time_in', $data['timeIn']);
            $stmt->bindParam(':time_out', $data['timeOut']);
            $stmt->bindParam(':hours_worked', $hoursWorked);
            $stmt->bindParam(':notes', $data['notes']);
            
            $stmt->execute();
            
            // Get the newly inserted log
            $id = $conn->lastInsertId();
            $query = "SELECT * FROM time_logs WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $log = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Add helpful info about lunch break
            if ($lunchDeduction > 0) {
                $log['lunch_deducted'] = true;
                $log['original_hours'] = $hoursWorked + $lunchDeduction;
            }
            
            sendResponse(true, "Time log added successfully", $log);
        } catch(PDOException $e) {
            sendResponse(false, "Error adding time log: " . $e->getMessage(), null, 500);
        } catch(Exception $e) {
            sendResponse(false, "Error processing time: " . $e->getMessage(), null, 400);
        }
        break;
        
    case 'DELETE':
        // Delete time log
        try {
            // Check if ID is provided in URL
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$id) {
                sendResponse(false, "ID is required", null, 400);
            }
            
            // Delete the log
            $query = "DELETE FROM time_logs WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                sendResponse(true, "Time log deleted successfully");
            } else {
                sendResponse(false, "Time log not found", null, 404);
            }
        } catch(PDOException $e) {
            sendResponse(false, "Error deleting time log: " . $e->getMessage(), null, 500);
        }
        break;
        
    default:
        sendResponse(false, "Method not allowed", null, 405);
} 