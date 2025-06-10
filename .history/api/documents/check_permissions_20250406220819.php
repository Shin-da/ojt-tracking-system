<?php
$upload_dir = '../uploads/documents/';

echo "Checking upload directory permissions...\n";

// Check if directory exists
if (!file_exists($upload_dir)) {
    echo "Creating upload directory...\n";
    if (mkdir($upload_dir, 0777, true)) {
        echo "Directory created successfully\n";
    } else {
        echo "Failed to create directory\n";
        exit(1);
    }
}

// Check directory permissions
$perms = fileperms($upload_dir);
echo "Current permissions: " . substr(sprintf('%o', $perms), -4) . "\n";

// Try to set permissions
if (chmod($upload_dir, 0777)) {
    echo "Permissions set to 777 successfully\n";
} else {
    echo "Failed to set permissions\n";
}

// Check if directory is writable
if (is_writable($upload_dir)) {
    echo "Directory is writable\n";
} else {
    echo "Directory is NOT writable\n";
}

// Try to create a test file
$test_file = $upload_dir . 'test.txt';
if (file_put_contents($test_file, 'test')) {
    echo "Successfully created test file\n";
    unlink($test_file);
    echo "Successfully deleted test file\n";
} else {
    echo "Failed to create test file\n";
}

echo "\nDirectory path: " . realpath($upload_dir) . "\n";
echo "PHP process user: " . get_current_user() . "\n";
echo "PHP process ID: " . getmypid() . "\n";
?> 