// File: src/main/java/com/nextgenbank/payment/domain/entity/Transaction.java
package com.nextgenbank.payment.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions", 
       indexes = {
           @Index(name = "idx_transactions_customer_status", columnList = "customer_id, status"),
           @Index(name = "idx_transactions_idempotency", columnList = "idempotency_key")
       })
public class Transaction {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID customerId;

    @Column(name = "account_from", nullable = false, length = 34)
    private String accountFrom;

    @Column(name = "account_to", nullable = false, length = 34)
    private String accountTo;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 20)
    private PaymentType paymentType;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @Column(length = 100)
    private String reference;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    // --- Constructor & Lifecycle ---
    public Transaction() {
        this.id = UUID.randomUUID();
        this.status = TransactionStatus.PENDING_APPROVAL;
        this.createdAt = ZonedDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    // --- State Machine Validation (Defensive Guardrails) ---
    public boolean canTransitionTo(TransactionStatus newStatus) {
        return switch (this.status) {
            case PENDING_APPROVAL -> 
                newStatus == TransactionStatus.APPROVED ||
                newStatus == TransactionStatus.REJECTED ||
                newStatus == TransactionStatus.MANUAL_REVIEW_REQUIRED;
            case MANUAL_REVIEW_REQUIRED ->
                newStatus == TransactionStatus.APPROVED ||
                newStatus == TransactionStatus.REJECTED ||
                newStatus == TransactionStatus.FAILED_SYSTEM_ERROR;
            case APPROVED -> 
                newStatus == TransactionStatus.EXECUTED ||
                newStatus == TransactionStatus.FAILED_SYSTEM_ERROR;
            default -> false;
        };
    }

    public void transitionTo(TransactionStatus newStatus) {
        if (!canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Invalid state transition: %s -> %s. Structural integrity violation.", 
                              this.status, newStatus));
        }
        this.status = newStatus;
    }

    // --- Getters/Setters (Omitting boilerplate for brevity in presentation) ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public String getAccountFrom() { return accountFrom; }
    public void setAccountFrom(String accountFrom) { this.accountFrom = accountFrom; }
    public String getAccountTo() { return accountTo; }
    public void setAccountTo(String accountTo) { this.accountTo = accountTo; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public TransactionStatus getStatus() { return status; }
    public PaymentType getPaymentType() { return paymentType; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getReference() { return reference; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }

    // Enums defined separately or inline. Inline here for single-file clarity per layer.
}

enum TransactionStatus {
    PENDING_APPROVAL, APPROVED, EXECUTED, REJECTED, FAILED_SYSTEM_ERROR, MANUAL_REVIEW_REQUIRED
}

enum PaymentType {
    SEPA_INSTANT, SEPA_STANDARD, DOMESTIC_RTGS, TEMPLATE_EXECUTION
}