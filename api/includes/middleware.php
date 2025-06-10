<?php
require_once __DIR__ . '/auth.php';

class Middleware {
    private $auth;
    private $public_routes = [
        '/api/auth/login.php',
        '/api/auth/register.php'
    ];

    public function __construct() {
        $this->auth = new Auth();
    }

    public function authenticate() {
        // Get the current request path
        $request_uri = $_SERVER['REQUEST_URI'];
        
        // Check if the current route is public
        foreach ($this->public_routes as $route) {
            if (strpos($request_uri, $route) !== false) {
                return true;
            }
        }

        // Get the authorization header
        $headers = getallheaders();
        $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        if (empty($auth_header)) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Authorization header is required'
            ]);
            exit;
        }

        // Extract the token
        if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
        } else {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid authorization header format'
            ]);
            exit;
        }

        // Verify the token
        $result = $this->auth->verifyToken($token);
        
        if (!$result['success']) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => $result['message']
            ]);
            exit;
        }

        // Store user data in request for later use
        $_REQUEST['user'] = $result['data']->data;
        
        return true;
    }

    public function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            if (!isset($data[$field]) || empty($data[$field])) {
                if (strpos($rule, 'required') !== false) {
                    $errors[$field] = ucfirst($field) . ' is required';
                }
                continue;
            }
            
            $value = $data[$field];
            
            if (strpos($rule, 'email') !== false && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $errors[$field] = 'Invalid email format';
            }
            
            if (strpos($rule, 'min:') !== false) {
                preg_match('/min:(\d+)/', $rule, $matches);
                $min = $matches[1];
                if (strlen($value) < $min) {
                    $errors[$field] = ucfirst($field) . ' must be at least ' . $min . ' characters';
                }
            }
            
            if (strpos($rule, 'max:') !== false) {
                preg_match('/max:(\d+)/', $rule, $matches);
                $max = $matches[1];
                if (strlen($value) > $max) {
                    $errors[$field] = ucfirst($field) . ' must not exceed ' . $max . ' characters';
                }
            }
        }
        
        return $errors;
    }
} 