<?php
// Disable error display in production
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Connect to MySQL without selecting a database
    $pdo = new PDO(
        "mysql:host=localhost",
        "root",
        "",
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );

    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS ojt_tracker");
    $pdo->exec("USE ojt_tracker");

    // Create time_logs table with updated structure
    $pdo->exec("CREATE TABLE IF NOT EXISTS time_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        time_in VARCHAR(8) NOT NULL,
        time_out VARCHAR(8) NOT NULL,
        hours_worked DECIMAL(5,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create settings table
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(50) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create holidays table
    $pdo->exec("CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type ENUM('Regular Holiday', 'Special Non-working Holiday', 'Special Working Holiday') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (date)
    )");

    // Insert default required_hours setting if it doesn't exist
    $stmt = $pdo->prepare("INSERT IGNORE INTO settings (key_name, value) VALUES ('required_hours', '500')");
    $stmt->execute();

    // Insert some default Philippine holidays for 2024
    $holidays = [
        ['2024-01-01', 'New Year\'s Day', 'Regular Holiday'],
        ['2024-02-10', 'Chinese New Year', 'Special Non-working Holiday'],
        ['2024-02-25', 'EDSA People Power Revolution Anniversary', 'Special Non-working Holiday'],
        ['2024-03-28', 'Maundy Thursday', 'Regular Holiday'],
        ['2024-03-29', 'Good Friday', 'Regular Holiday'],
        ['2024-03-30', 'Black Saturday', 'Special Non-working Holiday'],
        ['2024-04-09', 'Araw ng Kagitingan', 'Regular Holiday'],
        ['2024-05-01', 'Labor Day', 'Regular Holiday'],
        ['2024-06-12', 'Independence Day', 'Regular Holiday'],
        ['2024-08-21', 'Ninoy Aquino Day', 'Special Non-working Holiday'],
        ['2024-08-26', 'National Heroes Day', 'Regular Holiday'],
        ['2024-11-01', 'All Saints\' Day', 'Special Non-working Holiday'],
        ['2024-11-30', 'Bonifacio Day', 'Regular Holiday'],
        ['2024-12-25', 'Christmas Day', 'Regular Holiday'],
        ['2024-12-30', 'Rizal Day', 'Regular Holiday'],
        ['2024-12-31', 'Last Day of the Year', 'Special Non-working Holiday']
    ];

    $holidayStmt = $pdo->prepare("INSERT IGNORE INTO holidays (date, name, type) VALUES (?, ?, ?)");
    foreach ($holidays as $holiday) {
        $holidayStmt->execute($holiday);
    }

    echo json_encode([
        "success" => true,
        "message" => "Database and tables created successfully"
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database setup failed: " . $e->getMessage()
    ]);
}
?> 