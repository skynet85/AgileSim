package com.bankdemo.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class MockTransactionService {
    
    // Deterministic mock data ensures consistent demo behavior without DB flakiness.
    public List<Map<String, Object>> getHistory() {
        return List.of(
            Map.of("id", "TX-100", "date", "2024-05-10T09:30:00Z", "amount", -85.5, "desc", "Étterem", "status", "completed"),
            Map.of("id", "TX-101", "date", "2024-05-12T14:15:00Z", "amount", 2500.0, "desc", "Bérkrédit", "status", "completed")
        );
    }
}