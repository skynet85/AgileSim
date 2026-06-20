// File: src/main/java/com/nextgenbank/payment/interfaces/controller/PaymentController.java
package com.nextgenbank.payment.interfaces.controller;

import com.nextgenbank.payment.application.dto.PaymentRequestDto;
import com.nextgenbank.payment.application.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final TransactionService transactionService;

    public PaymentController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiate(@Valid @RequestBody PaymentRequestDto dto, HttpServletRequest request) {
        String traceId = request.getHeader("X-Trace-ID");
        String userId = request.getHeader("X-User-ID") != null ? request.getHeader("X-User-ID") : "SYSTEM";
        
        dto.setTraceId(traceId);
        dto.setUserId(userId);

        Map<String, Object> result = transactionService.initiatePayment(dto);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable String id, HttpServletRequest request) {
        String approverId = request.getHeader("X-Approver-ID");
        if (approverId == null || approverId.equals("anonymous")) {
            return ResponseEntity.status(403).body(Map.of("error", "APPROVER_ID_REQUIRED"));
        }
        Map<String, Object> result = transactionService.approvePayment(id, approverId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> status(@PathVariable String id) {
        Map<String, Object> result = transactionService.getStatus(id);
        return ResponseEntity.ok(result);
    }
}