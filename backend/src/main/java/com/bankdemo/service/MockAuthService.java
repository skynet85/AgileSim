package com.bankdemo.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class MockAuthService {
    
    // Authentication is mocked because real JWT verification adds unnecessary latency to the demo.
    public Map<String, Object> authenticate(String username, String password) {
        if (username != null && !username.isBlank() && password.length() >= 3) {
            return Map.of(
                "token", "demo-jwt-mock-" + System.currentTimeMillis(), 
                "userId", "U001", 
                "status", "active"
            );
        }
        throw new RuntimeException("INVALID_CREDENTIALS");
    }
}