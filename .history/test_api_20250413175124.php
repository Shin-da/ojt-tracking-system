<?php
// Test API endpoint with detailed error checking
$apiEndpoint = "http://localhost/OJT%20TRACKER/api/time_logs/stats.php";
echo "Testing API endpoint: $apiEndpoint\n\n";

// Check if CURL is available for better error handling
if (function_exists('curl_init')) {
    echo "Using CURL for request...\n";
    $ch = curl_init($apiEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    echo "HTTP Code: $httpCode\n";
    
    if ($error) {
        echo "CURL Error: $error\n";
    }
    
    curl_close($ch);
} else {
    echo "CURL not available, using file_get_contents...\n";
    
    $context = stream_context_create([
        'http' => [
            'ignore_errors' => true,
            'method' => 'GET',
            'timeout' => 30,
        ]
    ]);
    
    $response = @file_get_contents($apiEndpoint, false, $context);
    
    if (isset($http_response_header)) {
        echo "Response headers:\n";
        foreach ($http_response_header as $header) {
            echo "- $header\n";
        }
    }
}

if ($response === FALSE) {
    echo "ERROR: API endpoint not reachable!\n";
    if (isset($error_get_last)) {
        echo "Last error: " . print_r(error_get_last(), true) . "\n";
    }
} else {
    echo "API Response received! Length: " . strlen($response) . " bytes\n\n";
    echo "First 500 characters of response:\n" . substr($response, 0, 500) . "\n\n";
    
    $data = json_decode($response, true);
    if ($data === null) {
        echo "ERROR: Failed to parse JSON response! JSON error: " . json_last_error_msg() . "\n";
        
        // Check for common issues in the response
        if (preg_match('/<b>.*?(\w+).*?<\/b>.*?line.*?(\d+)/i', $response, $matches)) {
            echo "Looks like a PHP error: {$matches[1]} on line {$matches[2]}\n";
        }
        
        if (strpos($response, '<!DOCTYPE html>') === 0) {
            echo "Response is HTML instead of JSON. This is likely a server configuration issue.\n";
        }
    } else {
        echo "JSON parsed successfully!\n";
        echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
        
        if (!empty($data['message'])) {
            echo "Message: " . $data['message'] . "\n";
        }
        
        if (isset($data['data'])) {
            $dataDetails = $data['data'];
            echo "\nData overview:\n";
            echo "- Total hours: " . ($dataDetails['total_hours'] ?? 'N/A') . "\n";
            echo "- Total days: " . ($dataDetails['total_days'] ?? 'N/A') . "\n";
            echo "- Required hours: " . ($dataDetails['required_hours'] ?? 'N/A') . "\n";
            echo "- Progress: " . ($dataDetails['progress_percentage'] ?? 'N/A') . "%\n";
            echo "- Start date: " . ($dataDetails['start_date'] ?? 'N/A') . "\n";
            echo "- Monthly entries: " . count($dataDetails['monthly_hours'] ?? []) . "\n";
            echo "- Weekly entries: " . count($dataDetails['weekly_hours'] ?? []) . "\n";
            echo "- Heatmap entries: " . count($dataDetails['heatmap_data'] ?? []) . "\n";
            
            if (!empty($dataDetails['monthly_hours'])) {
                echo "\nFirst few monthly entries:\n";
                $counter = 0;
                foreach ($dataDetails['monthly_hours'] as $month) {
                    echo "- Month {$month['year']}-{$month['month']}: {$month['monthly_hours']} hours, {$month['days_logged']} days\n";
                    $counter++;
                    if ($counter >= 3) break;
                }
            }
            
            if (!empty($dataDetails['weekly_hours'])) {
                echo "\nFirst few weekly entries:\n";
                $counter = 0;
                foreach ($dataDetails['weekly_hours'] as $week) {
                    echo "- Week {$week['year']}-{$week['week']}: {$week['weekly_hours']} hours\n";
                    $counter++;
                    if ($counter >= 3) break;
                }
            }
            
            if (!empty($dataDetails['heatmap_data'])) {
                echo "\nFirst few heatmap entries:\n";
                $counter = 0;
                foreach ($dataDetails['heatmap_data'] as $day) {
                    echo "- Date {$day['date']}: {$day['hours_worked']} hours\n";
                    $counter++;
                    if ($counter >= 3) break;
                }
            }
        }
    }
}
?> 