package com.bankdemo.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final List<Map<String, Object>> transactions = new CopyOnWriteArrayList<>();

    public TransactionController() {
        transactions.add(Map.of("id", "TX-100", "date", "2024-05-10T09:30:00Z", "amount", -85.5, "desc", "Étterem", "status", "completed"));
        transactions.add(Map.of("id", "TX-101", "date", "2024-05-12T14:15:00Z", "amount", 2500.0, "desc", "Bérkrédit", "status", "completed"));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody Map<String, Object> tx) {
        if (tx.get("amount") == null || Double.parseDouble(tx.get("amount").toString()) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount"));
        }
        transactions.add(0, Map.of(
            "id", "TX-" + System.currentTimeMillis(),
            "date", java.time.Instant.now().toString(),
            "amount", tx.get("amount"),
            "desc", tx.getOrDefault("description", tx.getOrDefault("to", "Demo Transfer")),
            "status", "pending"
        ));
        return ResponseEntity.ok(Map.of("message", "Transaction recorded in demo mode"));
    }
}