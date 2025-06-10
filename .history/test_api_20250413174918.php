<?php
// Test API endpoint
$apiEndpoint = "http://localhost/OJT%20TRACKER/api/time_logs/stats.php";
echo "Testing API endpoint: $apiEndpoint\n\n";

$context = stream_context_create([
    'http' => [
        'ignore_errors' => true
    ]
]);

$response = @file_get_contents($apiEndpoint, false, $context);
if ($response === FALSE) {
    echo "ERROR: API endpoint not reachable!\n";
    echo "Last error: " . error_get_last()['message'] . "\n";
} else {
    echo "API Response received!\n";
    echo "Response length: " . strlen($response) . " bytes\n\n";
    
    $data = json_decode($response, true);
    if ($data === null) {
        echo "ERROR: Failed to parse JSON response!\n";
        echo "Raw response (first 500 chars):\n";
        echo substr($response, 0, 500) . "...\n";
    } else {
        echo "JSON parsed successfully\n";
        echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
        
        if (!empty($data['message'])) {
            echo "Message: " . $data['message'] . "\n";
        }
        
        if (isset($data['data'])) {
            $dataDetails = $data['data'];
            echo "\nData overview:\n";
            echo "- Total hours: " . ($dataDetails['total_hours'] ?? 'N/A') . "\n";
            echo "- Total days: " . ($dataDetails['total_days'] ?? 'N/A') . "\n";
            echo "- Start date: " . ($dataDetails['start_date'] ?? 'N/A') . "\n";
            echo "- Monthly entries: " . count($dataDetails['monthly_hours'] ?? []) . "\n";
            echo "- Weekly entries: " . count($dataDetails['weekly_hours'] ?? []) . "\n";
            echo "- Heatmap entries: " . count($dataDetails['heatmap_data'] ?? []) . "\n";
            
            echo "\nFirst few monthly entries:\n";
            $counter = 0;
            foreach ($dataDetails['monthly_hours'] ?? [] as $month) {
                echo "- Month {$month['year']}-{$month['month']}: {$month['monthly_hours']} hours, {$month['days_logged']} days\n";
                $counter++;
                if ($counter >= 3) break;
            }
            
            echo "\nFirst few weekly entries:\n";
            $counter = 0;
            foreach ($dataDetails['weekly_hours'] ?? [] as $week) {
                echo "- Week {$week['year']}-{$week['week']}: {$week['weekly_hours']} hours\n";
                $counter++;
                if ($counter >= 3) break;
            }
            
            echo "\nFirst few heatmap entries:\n";
            $counter = 0;
            foreach ($dataDetails['heatmap_data'] ?? [] as $day) {
                echo "- Date {$day['date']}: {$day['hours_worked']} hours\n";
                $counter++;
                if ($counter >= 3) break;
            }
        }
    }
}
?> 