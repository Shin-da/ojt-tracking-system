<?php
// Connect to the database
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'ojt_tracker';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected successfully\n\n";
    
    // Drop and recreate the time_logs table
    $dropTable = "DROP TABLE IF EXISTS time_logs";
    $conn->exec($dropTable);
    echo "Dropped time_logs table\n";
    
    // Create the time_logs table with the correct structure
    $createTable = "
    CREATE TABLE time_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT 1,
        date DATE NOT NULL,
        time_in TIME NOT NULL,
        time_out TIME NOT NULL,
        hours_worked DECIMAL(5,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $conn->exec($createTable);
    echo "Created time_logs table with proper structure\n";
    
    // Insert sample data - several months of data for proper visualization
    $insertData = "
    -- February 2024
    INSERT INTO time_logs (user_id, date, time_in, time_out, hours_worked, notes) VALUES
    (1, '2024-02-12', '08:00:00', '17:00:00', 8.0, 'First day of OJT'),
    (1, '2024-02-13', '08:30:00', '17:30:00', 8.0, 'Learning company policies'),
    (1, '2024-02-14', '08:15:00', '16:45:00', 7.5, 'Introduction to projects'),
    (1, '2024-02-15', '08:00:00', '17:00:00', 8.0, 'Team meeting'),
    (1, '2024-02-16', '08:30:00', '17:00:00', 7.5, 'Training day'),
    (1, '2024-02-19', '08:00:00', '17:00:00', 8.0, 'Working on frontend'),
    (1, '2024-02-20', '08:15:00', '16:45:00', 7.5, 'Documentation work'),
    (1, '2024-02-21', '08:30:00', '17:30:00', 8.0, 'Meeting with supervisor'),
    (1, '2024-02-22', '08:00:00', '17:00:00', 8.0, 'Database training'),
    (1, '2024-02-23', '08:15:00', '16:45:00', 7.5, 'Frontend development'),
    (1, '2024-02-26', '08:30:00', '17:30:00', 8.0, 'Backend development'),
    (1, '2024-02-27', '08:00:00', '17:00:00', 8.0, 'API integration'),
    (1, '2024-02-28', '08:15:00', '16:45:00', 7.5, 'Testing'),
    (1, '2024-02-29', '08:30:00', '17:30:00', 8.0, 'Bug fixing');
    
    -- March 2024
    INSERT INTO time_logs (user_id, date, time_in, time_out, hours_worked, notes) VALUES
    (1, '2024-03-01', '08:00:00', '17:00:00', 8.0, 'Database design'),
    (1, '2024-03-04', '08:15:00', '16:45:00', 7.5, 'UI/UX design'),
    (1, '2024-03-05', '08:30:00', '17:30:00', 8.0, 'Frontend development'),
    (1, '2024-03-06', '08:00:00', '17:00:00', 8.0, 'Backend integration'),
    (1, '2024-03-07', '08:15:00', '16:45:00', 7.5, 'API development'),
    (1, '2024-03-08', '08:30:00', '17:30:00', 8.0, 'Documentation'),
    (1, '2024-03-11', '08:00:00', '17:00:00', 8.0, 'Testing'),
    (1, '2024-03-12', '08:15:00', '16:45:00', 7.5, 'Bug fixing'),
    (1, '2024-03-13', '08:30:00', '17:30:00', 8.0, 'Code review'),
    (1, '2024-03-14', '08:00:00', '17:00:00', 8.0, 'Team meeting'),
    (1, '2024-03-15', '08:15:00', '16:45:00', 7.5, 'Documentation'),
    (1, '2024-03-18', '08:30:00', '17:30:00', 8.0, 'Testing'),
    (1, '2024-03-19', '08:00:00', '17:00:00', 8.0, 'Deployment'),
    (1, '2024-03-20', '08:15:00', '16:45:00', 7.5, 'System integration');
    
    -- April 2024 (current month)
    INSERT INTO time_logs (user_id, date, time_in, time_out, hours_worked, notes) VALUES
    (1, '2024-04-01', '08:00:00', '17:00:00', 8.0, 'Project planning'),
    (1, '2024-04-02', '08:15:00', '16:45:00', 7.5, 'Research task'),
    (1, '2024-04-03', '08:30:00', '17:30:00', 8.0, 'Development work'),
    (1, '2024-04-04', '08:00:00', '17:00:00', 8.0, 'Testing'),
    (1, '2024-04-05', '08:15:00', '16:45:00', 7.5, 'Documentation'),
    (1, '2024-04-08', '08:30:00', '17:30:00', 8.0, 'Team meeting'),
    (1, '2024-04-09', '08:00:00', '17:00:00', 8.0, 'Development work'),
    (1, '2024-04-10', '08:15:00', '16:45:00', 7.5, 'Code review'),
    (1, '2024-04-11', '08:30:00', '17:30:00', 8.0, 'Bug fixes'),
    (1, '2024-04-12', '08:00:00', '17:00:00', 8.0, 'Progress report')
    ";
    
    $conn->exec($insertData);
    echo "Inserted 38 sample time logs across multiple months\n";
    
    // Verify record count
    $countQuery = "SELECT COUNT(*) FROM time_logs";
    $count = $conn->query($countQuery)->fetchColumn();
    echo "Total records in time_logs: $count\n";
    
    // Make sure settings are correct
    $insertSettings = "
    INSERT IGNORE INTO settings (key_name, value) VALUES
    ('ojt_start_date', '2024-02-12'),
    ('required_hours', '600'),
    ('work_days', 'Monday,Tuesday,Wednesday,Thursday,Friday')
    ";
    
    $conn->exec($insertSettings);
    echo "Settings verified\n";
    
    echo "\nDone! The time_logs table has been successfully recreated with sample data.";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?> 