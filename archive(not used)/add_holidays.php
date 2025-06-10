<?php
require_once __DIR__ . '/api/includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Clear existing holidays
    $db->query("TRUNCATE TABLE holidays");
    
    // Insert holidays for 2024 and 2025
    $holidays = [
        // 2024 Holidays
        ['2024-01-01', "New Year's Day", 'Regular Holiday'],
        ['2024-02-10', 'Chinese New Year', 'Special Non-working Holiday'],
        ['2024-02-25', 'EDSA People Power Revolution Anniversary', 'Special Non-working Holiday'],
        ['2024-03-28', 'Maundy Thursday', 'Regular Holiday'],
        ['2024-03-29', 'Good Friday', 'Regular Holiday'],
        ['2024-03-30', 'Black Saturday', 'Special Non-working Holiday'],
        ['2024-03-31', 'Easter Sunday', 'Special Non-working Holiday'],
        ['2024-04-09', 'Araw ng Kagitingan', 'Regular Holiday'],
        ['2024-05-01', 'Labor Day', 'Regular Holiday'],
        ['2024-06-12', 'Independence Day', 'Regular Holiday'],
        ['2024-06-19', 'Jose Rizal Day', 'Special Non-working Holiday'],
        ['2024-08-21', 'Ninoy Aquino Day', 'Special Non-working Holiday'],
        ['2024-08-26', 'National Heroes Day', 'Regular Holiday'],
        ['2024-11-01', 'All Saints Day', 'Special Non-working Holiday'],
        ['2024-11-30', 'Bonifacio Day', 'Regular Holiday'],
        ['2024-12-24', 'Christmas Eve', 'Special Non-working Holiday'],
        ['2024-12-25', 'Christmas Day', 'Regular Holiday'],
        ['2024-12-30', 'Rizal Day', 'Regular Holiday'],
        ['2024-12-31', 'New Years Eve', 'Special Non-working Holiday'],

        // 2025 Holidays
        ['2025-01-01', "New Year's Day", 'Regular Holiday'],
        ['2025-01-25', 'Chinese New Year', 'Special Non-working Holiday'],
        ['2025-02-25', 'EDSA People Power Revolution Anniversary', 'Special Non-working Holiday'],
        ['2025-04-17', 'Maundy Thursday', 'Regular Holiday'],
        ['2025-04-18', 'Good Friday', 'Regular Holiday'],
        ['2025-04-19', 'Black Saturday', 'Special Non-working Holiday'],
        ['2025-04-20', 'Easter Sunday', 'Special Non-working Holiday'],
        ['2025-04-09', 'Araw ng Kagitingan', 'Regular Holiday'],
        ['2025-05-01', 'Labor Day', 'Regular Holiday'],
        ['2025-06-12', 'Independence Day', 'Regular Holiday'],
        ['2025-06-19', 'Jose Rizal Day', 'Special Non-working Holiday'],
        ['2025-08-21', 'Ninoy Aquino Day', 'Special Non-working Holiday'],
        ['2025-08-25', 'National Heroes Day', 'Regular Holiday'],
        ['2025-11-01', 'All Saints Day', 'Special Non-working Holiday'],
        ['2025-11-30', 'Bonifacio Day', 'Regular Holiday'],
        ['2025-12-24', 'Christmas Eve', 'Special Non-working Holiday'],
        ['2025-12-25', 'Christmas Day', 'Regular Holiday'],
        ['2025-12-30', 'Rizal Day', 'Regular Holiday'],
        ['2025-12-31', 'New Years Eve', 'Special Non-working Holiday']
    ];
    
    $stmt = $db->prepare("INSERT INTO holidays (date, name, type) VALUES (?, ?, ?)");
    
    foreach ($holidays as $holiday) {
        $stmt->execute($holiday);
    }
    
    echo "Successfully added " . count($holidays) . " holidays to the database.";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?> 