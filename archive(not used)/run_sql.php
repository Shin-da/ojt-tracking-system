<?php
// Include database connection
require_once 'api/includes/db_connect.php';

try {
    // Connect to database
    $database = new Database();
    $conn = $database->getConnection();
    
    echo "Connected successfully\n";
    
    // Execute SQL to fix tables
    $sql = "
        -- Fix the time_logs table structure
        ALTER TABLE time_logs 
        ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1 AFTER id,
        ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER time_out,
        ADD COLUMN IF NOT EXISTS notes TEXT AFTER hours_worked;
        
        -- Add index on date
        ALTER TABLE time_logs
        ADD INDEX IF NOT EXISTS idx_date (date);
        
        -- Insert initial settings if they don't exist
        INSERT IGNORE INTO settings (key_name, value) VALUES
        ('ojt_start_date', '2024-02-12'),
        ('required_hours', '600'),
        ('work_days', 'Monday,Tuesday,Wednesday,Thursday,Friday');
    ";
    
    $conn->exec($sql);
    echo "SQL executed successfully\n";
    
    // Insert some sample data for testing
    $sampleDataSql = "
        -- Add some sample time logs if none exist
        INSERT INTO time_logs (date, time_in, time_out, hours_worked, notes)
        SELECT '2024-02-15', '08:00:00', '17:00:00', 8.5, 'First day of OJT'
        WHERE NOT EXISTS (SELECT 1 FROM time_logs LIMIT 1);
        
        INSERT INTO time_logs (date, time_in, time_out, hours_worked, notes)
        SELECT '2024-02-16', '08:30:00', '17:30:00', 8.0, 'Second day of OJT'
        WHERE NOT EXISTS (SELECT 1 FROM time_logs LIMIT 1);
        
        INSERT INTO time_logs (date, time_in, time_out, hours_worked, notes)
        SELECT '2024-02-19', '08:00:00', '16:30:00', 7.5, 'Learning basics'
        WHERE NOT EXISTS (SELECT 1 FROM time_logs LIMIT 1);
    ";
    
    $conn->exec($sampleDataSql);
    echo "Sample data inserted successfully\n";
    
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?> 