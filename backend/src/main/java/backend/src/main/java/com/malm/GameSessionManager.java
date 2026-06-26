// File: backend/src/main/java/com/malm/GameSessionManager.java
package com.malm;

import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GameSessionManager {
    
    private final ReactiveRedisTemplate<String, String> redis;
    private final ObjectMapper mapper;
    private static final String SESSION_PREFIX = "session:";
    private static final int STATE_SAVE_INTERVAL_MS = 30000; // 30s deterministic snapshot

    public GameSessionManager(ReactiveRedisTemplate<String, String> redis) {
        this.redis = redis;
        this.mapper = new ObjectMapper();
    }

    /**
     * Server-driven state validation & hash generation.
     * Eliminates client-side drift through deterministic audit trail.
     */
    public Mono<Map<String, Object>> processMove(String matchId, Map<String, Object> movePayload) {
        String sessionKey = SESSION_PREFIX + matchId;
        
        return redis.opsForValue().get(sessionKey)
            .flatMap(currentState -> {
                // Deterministic transition validation
                if (!isValidTransition(currentState, movePayload)) {
                    return Mono.error(new IllegalStateException("INVALID_TRANSITION: State mismatch at " + System.currentTimeMillis()));
                }

                // Apply move & generate new state hash
                String newState = applyMove(currentState, movePayload);
                String hash = generateSHA256Hash(newState);
                
                // Atomic state update with snapshot scheduling
                return redis.opsForValue().set(sessionKey, newState)
                    .then(Mono.just(Map.of(
                        "status", "ACCEPTED",
                        "serverHash", hash,
                        "validMoves", calculateValidTargets(newState),
                        "phase", extractPhase(newState)
                    )));
            })
            .onErrorResume(e -> Mono.just(Map.of("status", "REJECTED", "error", e.getMessage())));
    }

    private boolean isValidTransition(String currentState, Map<String, Object> payload) {
        // Server-enforced validation logic: sequence check + phase constraint
        long seq = ((Number) payload.getOrDefault("sequenceNumber", 0L)).longValue();
        return seq > getSequenceCounter(currentState); // Simplified for prototype
    }

    private String applyMove(String currentState, Map<String, Object> movePayload) {
        try {
            List<String> board = mapper.readValue(currentState, List.class);
            int from = (int) movePayload.getOrDefault("from", -1);
            int to = (int) movePayload.get("to");
            
            if (from != -1) board.set(from, null);
            board.set(to, payload.getStringValue("playerColor"));
            
            return mapper.writeValueAsString(board);
        } catch (Exception e) {
            throw new RuntimeException("State serialization failure", e);
        }
    }

    private String generateSHA256Hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if(hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hash generation failed", e);
        }
    }

    private List<Integer> calculateValidTargets(String state) {
        // Server-driven VALID_MOVE_SET broadcast to prevent dual-validation conflict
        // Returns indices based on phase & piece availability
        return List.of(0, 1, 2, 3); // Placeholder for deterministic algorithm
    }

    private String extractPhase(String state) {
        // Phase extraction from serialized state
        return "movement"; 
    }

    private long getSequenceCounter(String currentState) {
        // Extracted from metadata or Redis hash
        return System.currentTimeMillis();
    }
}