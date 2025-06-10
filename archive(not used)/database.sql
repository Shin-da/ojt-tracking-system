-- Create the database
CREATE DATABASE IF NOT EXISTS ojt_tracker;

-- Use the database
USE ojt_tracker;

-- Add location column to time_logs table
ALTER TABLE time_logs
ADD COLUMN location ENUM('on-site', 'work-from-home') DEFAULT 'on-site' AFTER hours_worked;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial settings
INSERT INTO settings (key_name, value) VALUES
('ojt_start_date', '2024-02-12'),
('required_hours', '600'),
('work_days', 'Monday,Tuesday,Wednesday,Thursday,Friday');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create progress_logs table
CREATE TABLE IF NOT EXISTS progress_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    skills_learned TEXT,
    challenges TEXT,
    achievements TEXT,
    reflection TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Regular Holiday', 'Special Non-working Holiday', 'Special Working Holiday') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample holidays for 2024
INSERT INTO holidays (date, name, type) VALUES
('2024-03-28', 'Maundy Thursday', 'Regular Holiday'),
('2024-03-29', 'Good Friday', 'Regular Holiday'),
('2024-04-09', 'Araw ng Kagitingan', 'Regular Holiday'),
('2024-05-01', 'Labor Day', 'Regular Holiday'),
('2024-06-12', 'Independence Day', 'Regular Holiday'),
('2024-08-26', 'National Heroes Day', 'Regular Holiday'),
('2024-11-30', 'Bonifacio Day', 'Regular Holiday'),
('2024-12-25', 'Christmas Day', 'Regular Holiday'),
('2024-12-30', 'Rizal Day', 'Regular Holiday');