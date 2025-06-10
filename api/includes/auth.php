<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/jwt.php';  // Add JWT requirement

class Auth {
    private $db;
    private $secret_key = "ojt-tracker-secret-key-2024"; // Updated secret key

    public function __construct() {
        try {
            $database = new Database();
            $this->db = $database->getConnection();
        } catch (Exception $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public function login($username, $password) {
        try {
            $query = "SELECT id, username, password, full_name, email FROM users WHERE username = :username";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":username", $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($password, $row['password'])) {
                    // Generate JWT token
                    $token = $this->generateToken($row);
                    
                    return [
                        "success" => true,
                        "message" => "Login successful",
                        "data" => [
                            "token" => $token,
                            "user" => [
                                "id" => $row['id'],
                                "username" => $row['username'],
                                "full_name" => $row['full_name'],
                                "email" => $row['email']
                            ]
                        ]
                    ];
                }
            }
            
            return [
                "success" => false,
                "message" => "Invalid username or password"
            ];
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            throw new Exception("Login failed: " . $e->getMessage());
        }
    }

    public function verifyToken($token) {
        try {
            $decoded = JWT::decode($token, $this->secret_key, array('HS256'));
            return [
                "success" => true,
                "data" => $decoded
            ];
        } catch (Exception $e) {
            return [
                "success" => false,
                "message" => "Invalid token"
            ];
        }
    }

    private function generateToken($user) {
        $issued_at = time();
        $expiration_time = $issued_at + (60 * 60 * 24); // Token valid for 24 hours
        
        $payload = array(
            "iat" => $issued_at,
            "exp" => $expiration_time,
            "data" => array(
                "id" => $user['id'],
                "username" => $user['username'],
                "email" => $user['email']
            )
        );
        
        return JWT::encode($payload, $this->secret_key);
    }

    public function register($username, $password, $full_name, $email) {
        try {
            // Check if username or email already exists
            $query = "SELECT id FROM users WHERE username = :username OR email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":username", $username);
            $stmt->bindParam(":email", $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    "success" => false,
                    "message" => "Username or email already exists"
                ];
            }

            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Insert new user
            $query = "INSERT INTO users (username, password, full_name, email) 
                     VALUES (:username, :password, :full_name, :email)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":username", $username);
            $stmt->bindParam(":password", $hashed_password);
            $stmt->bindParam(":full_name", $full_name);
            $stmt->bindParam(":email", $email);

            if ($stmt->execute()) {
                return [
                    "success" => true,
                    "message" => "User registered successfully"
                ];
            }

            return [
                "success" => false,
                "message" => "Registration failed"
            ];
        } catch (Exception $e) {
            return [
                "success" => false,
                "message" => "Registration failed: " . $e->getMessage()
            ];
        }
    }
} 