// File: src/main/java/com/nextgenbank/payment/infrastructure/kafka/PaymentEventProducer.java
package com.nextgenbank.payment.infrastructure.kafka;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

@Component
public class PaymentEventProducer {

    private static final String TOPIC_INITIATED = "nextgen.payment.initiated.v1";
    private static final String TOPIC_STATUS_CHANGED = "nextgen.payment.status.changed.v1";
    private static final String TOPIC_DLQ = "nextgen.payment.dlq.v1";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PaymentEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Standard Envelope konstrukció. A partíciós kulcs nem statisztikai korreláció,
     * hanem strukturális kötelezettség: garantálja az állapotgép-szinkronizációt.
     */
    public void publishInitiationEvent(Object payload) {
        sendMessage(TOPIC_INITIATED, payload);
    }

    private void sendMessage(String topic, Object payload) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(
                topic,
                extractPartitionKey(payload),
                buildEnvelope(payload, topic)
            );

            kafkaTemplate.send(record).whenComplete((result, ex) -> {
                if (ex != null) {
                    // DLQ routing: a hiba nem rejtőzik el; strukturálisan izolálódik
                    kafkaTemplate.send(new ProducerRecord<>(TOPIC_DLQ, UUID.randomUUID().toString(), 
                        Map.of("error", ex.getMessage(), "original_topic", topic, "payload", payload)));
                }
            });
        } catch (Exception e) {
            // Túlkompenzált kivételkezelés: a ritka katasztrófa megakadályozza a kaotikus állapotot
            kafkaTemplate.send(new ProducerRecord<>(TOPIC_DLQ, UUID.randomUUID().toString(), 
                Map.of("fatal_routing_error", e.getMessage(), "payload", payload)));
        }
    }

    private String extractPartitionKey(Object payload) {
        // Specifikáció: customerId a determinisztikus partíciós kulcs
        try {
            var map = (Map<String, Object>) payload;
            return String.valueOf(map.get("customerId"));
        } catch (ClassCastException e) {
            throw new IllegalStateException("Payload must contain 'customerId' for partition key routing.");
        }
    }

    private Map<String, Object> buildEnvelope(Object payload, String originalTopic) {
        return Map.of(
            "header", Map.of(
                "messageId", UUID.randomUUID().toString(),
                "correlationId", extractCorrelationId(payload),
                "traceId", extractTraceId(payload),
                "eventType", "INITIATED",
                "version", "v1"
            ),
            "payload", payload,
            "metadata", Map.of(
                "sourceService", "PaymentCore",
                "routingStrategy", "deterministic_partition",
                "dlqEligible", true,
                "auditTrailRequired", true
            )
        );
    }

    private String extractCorrelationId(Object payload) {
        try { return ((Map<String, Object>) payload).get("correlationId").toString(); } catch (Exception e) { return UUID.randomUUID().toString(); }
    }

    private String extractTraceId(Object payload) {
        try { return ((Map<String, Object>) payload).get("traceId").toString(); } catch (Exception e) { return "UNTRACKED"; }
    }
}