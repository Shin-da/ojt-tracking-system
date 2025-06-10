-- Drop and recreate time_logs table with correct structure
DROP TABLE IF EXISTS time_logs;

CREATE TABLE time_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix the time_logs table structure
ALTER TABLE time_logs 
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1 AFTER id,
ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5,2) NOT NULL AFTER time_out,
ADD COLUMN IF NOT EXISTS notes TEXT AFTER hours_worked;

-- Add index on date
ALTER TABLE time_logs
ADD INDEX IF NOT EXISTS idx_date (date);

-- Add location column to time_logs table if it doesn't exist
ALTER TABLE time_logs 
ADD COLUMN IF NOT EXISTS location ENUM('on-site', 'work-from-home') DEFAULT 'on-site' AFTER hours_worked;

-- Insert initial settings if they don't exist
INSERT IGNORE INTO settings (key_name, value) VALUES
('ojt_start_date', '2024-02-12'),
('required_hours', '600'),
('work_days', 'Monday,Tuesday,Wednesday,Thursday,Friday'); 