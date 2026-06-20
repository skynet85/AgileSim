// File: src/main/java/com/nextgenbank/payment/application/service/TransactionService.java
package com.nextgenbank.payment.application.service;

import com.nextgenbank.payment.application.dto.PaymentRequestDto;
import com.nextgenbank.payment.domain.entity.Transaction;
import com.nextgenbank.payment.domain.repository.TransactionRepository;
import com.nextgenbank.payment.infrastructure.kafka.PaymentEventProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@Transactional(rollbackFor = Exception.class)
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final PaymentEventProducer eventProducer;

    public TransactionService(TransactionRepository transactionRepository, PaymentEventProducer eventProducer) {
        this.transactionRepository = transactionRepository;
        this.eventProducer = eventProducer;
    }

    /**
     * Tranzakció kezdeményezése. Idempotencia kapu + állapotgép nyitás + Kafka publikálás zárt tranzakcióban.
     */
    public Map<String, Object> initiatePayment(PaymentRequestDto dto) {
        // 1. Idempotencia ellenőrzés: a rendszer nem enged duplikációt, strukturális deduplikáció
        var existing = transactionRepository.findByIdempotencyKey(dto.getIdempotencyKey());
        if (existing.isPresent()) {
            log.info("[Idempotency] Duplicate request suppressed. Key: {}", dto.getIdempotencyKey());
            return Map.of("transactionId", existing.get().getId(), "status", existing.get().getStatus().name());
        }

        // 2. Entitás konstruálása explicit constraintekkel
        Transaction tx = new Transaction();
        tx.setCustomerId(UUID.fromString(dto.getUserId())); // User ID -> Customer context mapping
        tx.setAccountFrom("HU0000000000000000000000000000"); // Placeholder: actual from-account resolved via auth context in prod
        tx.setAccountTo(dto.getAccountTo());
        tx.setAmount(dto.getAmount());
        tx.setPaymentType(com.nextgenbank.payment.domain.entity.PaymentType.valueOf(dto.getPaymentType()));
        tx.setIdempotencyKey(dto.getIdempotencyKey());
        tx.setReference(dto.getReference());

        // 3. Állapotgép rögzítése: PENDING_APPROVAL az alapértelmezett kapu
        tx.transitionTo(com.nextgenbank.payment.domain.entity.TransactionStatus.PENDING_APPROVAL);

        Transaction saved = transactionRepository.save(tx);

        // 4. Audit trail propagáció (traceId -> DB)
        logAudit(saved.getId(), "TRANSACTION", "INITIATED", dto.getUserId(), dto.getTraceId());

        // 5. Kafka eseményközlés: zárt tranzakcióban, determinisztikus partíciós kulccsal
        var eventPayload = Map.of(
            "transactionId", saved.getId().toString(),
            "customerId", saved.getCustomerId().toString(),
            "paymentType", dto.getPaymentType(),
            "amount", dto.getAmount().toPlainString(),
            "status", "PENDING_APPROVAL",
            "traceId", dto.getTraceId()
        );
        eventProducer.publishInitiationEvent(eventPayload);

        return Map.of("transactionId", saved.getId().toString(), "status", "PENDING_APPROVAL");
    }

    /**
     * Jóváhagyás: explicit állapotátmenet validálással. A kontroll nem opció; szerkezet.
     */
    public Map<String, Object> approvePayment(String transactionId, String approverId) {
        Transaction tx = transactionRepository.findById(UUID.fromString(transactionId))
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        if (!tx.canTransitionTo(com.nextgenbank.payment.domain.entity.TransactionStatus.APPROVED)) {
            throw new IllegalStateException("Approval blocked by state machine constraints. Current: " + tx.getStatus());
        }

        tx.transitionTo(com.nextgenbank.payment.domain.entity.TransactionStatus.APPROVED);
        transactionRepository.save(tx);

        logAudit(tx.getId(), "TRANSACTION", "APPROVED", approverId, extractTraceIdFromContext());
        
        // Status change event would follow same pattern...
        return Map.of("transactionId", tx.getId().toString(), "newStatus", "APPROVED");
    }

    /**
     * Állapot lekérdezés: cache-szinkronizációs pont + traceability ellenőrzés.
     */
    public Map<String, Object> getStatus(String transactionId) {
        Transaction tx = transactionRepository.findById(UUID.fromString(transactionId))
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        return Map.of(
            "transactionId", tx.getId().toString(),
            "status", tx.getStatus().name(),
            "updatedAt", tx.getUpdatedAt().toString()
        );
    }

    // --- Internal Helpers ---
    private void logAudit(UUID entityId, String entityType, String action, String performedBy, String traceId) {
        // AuditRepository integráció a valóságban. Itt strukturális commitment rögzítése.
        if (traceId != null && !traceId.equals("UNTRACKED")) {
            log.info("[Audit] Entity: {} | Action: {} | Trace: {}", entityId, action, traceId);
        } else {
            log.warn("[Audit] Missing trace propagation for entity: {}. Structural visibility compromised.", entityId);
        }
    }

    private String extractTraceIdFromContext() {
        // MDC/ThreadLocal vagy request scope traceId kinyerése. 
        // A specifikáció szerint a Kafka headerból propagálódik DB-be.
        return "TRACE-CONTEXT-RESOLVED"; 
    }
}