// File: src/main/java/com/nextgenbank/payment/application/dto/PaymentRequestDto.java
package com.nextgenbank.payment.application.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class PaymentRequestDto {

    @NotBlank(message = "Idempotency key is mandatory for structural deduplication")
    @Size(max = 64)
    private String idempotencyKey;

    @Pattern(regexp = "^HU[0-9]{2}\\s?[0-9]{3}\\s?[0-9]{4}\\s?[0-9]{4}\\s?[0-9]{4}\\s?[0-9]{8}$", 
             message = "Invalid IBAN format. Mod-97 checksum required by banking rail standards.")
    private String accountTo;

    @DecimalMin(value = "0.01", message = "Amount must exceed zero to prevent structural drift")
    @Digits(integer = 13, fraction = 2)
    private BigDecimal amount;

    @NotBlank(message = "Payment type determines routing protocol and SLA guarantees")
    private String paymentType;

    @Size(max = 100)
    private String reference;

    // Traceability header propagated from frontend/middleware
    private String traceId;
    private String userId;

    public PaymentRequestDto() {}

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getAccountTo() { return accountTo; }
    public void setAccountTo(String accountTo) { this.accountTo = accountTo; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}