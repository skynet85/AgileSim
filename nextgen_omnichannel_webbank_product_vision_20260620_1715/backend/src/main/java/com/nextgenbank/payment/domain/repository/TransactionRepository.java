// File: src/main/java/com/nextgenbank/payment/domain/repository/TransactionRepository.java
package com.nextgenbank.payment.domain.repository;

import com.nextgenbank.payment.domain.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    /**
     * Idempotency enforcement: a rendszer nem nyel el duplikált kéréseket,
     * strukturálisan rögzíti az eredeti bemenetet.
     */
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
}