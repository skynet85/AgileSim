// File: src/main/java/com/nextgenbank/payment/domain/repository/AuditLogRepository.java
package com.nextgenbank.payment.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<Object, Long> {
    // Structural note: Audit logs are typically written via direct SQL or separate JPA entity.
    // For Clean Architecture isolation, this acts as the structural commitment point for traceability.
}