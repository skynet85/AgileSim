package com.bankdemo.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String u, @RequestParam String p) { 
        if (u == null || p.length() < 3) {
            return ResponseEntity.status(401).body(Map.of("error", "INVALID_CREDENTIALS"));
        }
        return ResponseEntity.ok(Map.of("token", "demo-jwt-" + System.currentTimeMillis(), "userId", "U001", "username", u));
    }
}