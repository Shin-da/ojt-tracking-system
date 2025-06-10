<?php
class JWT {
    public static function encode($payload, $key) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function decode($jwt, $key) {
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = explode('.', $jwt);
        
        // Verify signature
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $signatureEncoded) {
            throw new Exception('Invalid signature');
        }
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadEncoded)), true);
        
        // Verify expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired');
        }
        
        return $payload;
    }
} 