<?php
$start_date = '2024-03-01';
$end_date = '2024-03-31';
$url = "http://localhost/OJT%20TRACKER/api/holidays/index.php?start_date={$start_date}&end_date={$end_date}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<pre>";
echo "URL: " . $url . "\n\n";
echo "HTTP Status Code: " . $httpCode . "\n\n";
echo "Response:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
echo "</pre>";
?> 