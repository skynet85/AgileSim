package com.malom.game.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class GameService {

    // Server-authoritative state store (in-memory for MVP, replace with Redis in v0.3)
    private final Map<String, GameState> rooms = new ConcurrentHashMap<>();
    private final ObjectMapper jacksonMapper = new ObjectMapper(); // Explicit JSONB serialization fix
    private final AtomicLong globalSeqCounter = new AtomicLong(0);

    public static class MoveAttempt {
        public int from; // nullable in PLACING phase
        public int to;
        public long clientSeqId;
    }

    public static class GameState {
        public String matchId;
        public String mode;
        public int turnPlayer = 1;
        public Map<Integer, Integer> board = new HashMap<>(); // 0-23 -> 0/1/2
        public int[] hands = {9, 9};
        public String phase = "PLACING";
        public long seqId = 0;
    }

    public synchronized void initRoom(String matchId, String mode) {
        GameState state = new GameState();
        state.matchId = matchId;
        state.mode = mode;
        rooms.put(matchId, state);
    }

    /**
     * Server-authoritative validation gate. Rejects invalid moves explicitly.
     * Implements phase-aware state machine: PLACING → MOVING → REMOVING → GAME_OVER
     */
    public Map<String, Object> processMove(String matchId, MoveAttempt attempt) {
        GameState s = rooms.get(matchId);
        if (s == null || s.phase.equals("GAME_OVER")) return errorPayload("ROOM_NOT_FOUND_OR_FINISHED");

        long currentSeq = globalSeqCounter.incrementAndGet();
        
        // Phase-aware validation
        boolean valid = false;
        if ("PLACING".equals(s.phase)) {
            int player = s.turnPlayer;
            if (s.board.getOrDefault(attempt.to, -1) == null && s.hands[player-1] > 0) {
                valid = true;
            }
        } else if ("MOVING".equals(s.phase)) {
            // Simplified adjacency check for MVP: target must be empty & adjacent to ANY owned piece
            if (s.board.getOrDefault(attempt.to, -1) == null && isAdjacentToOwnedPiece(s, attempt.to, s.turnPlayer)) {
                valid = true;
            }
        } else if ("REMOVING".equals(s.phase)) {
            if (s.board.get(attempt.to) != null && s.board.get(attempt.to) != s.turnPlayer) {
                valid = true;
            }
        }

        if (!valid) return errorPayload("VALIDATION_REJECTED_INVALID_MOVE");

        // Apply move deterministically
        s.board.put(attempt.to, s.turnPlayer);
        
        if ("PLACING".equals(s.phase)) {
            s.hands[s.turnPlayer - 1]--;
            emitEvent(matchId, "PHASE_TRANSITION", Map.of("from", "PLACING"));
            
            if (s.hands[0] == 0 && s.hands[1] == 0) {
                s.phase = "MOVING";
            } else if (hasFormedMill(s.board, attempt.to, s.turnPlayer)) {
                s.phase = "REMOVING";
                emitEvent(matchId, "MILL_TRIGGERED", List.of(attempt.to));
            }
        } else if ("MOVING".equals(s.phase) && hasFormedMill(s.board, attempt.to, s.turnPlayer)) {
            s.phase = "REMOVING";
            emitEvent(matchId, "MILL_TRIGGERED", List.of(attempt.to));
        }

        // Win condition check (< 3 pieces & no hands left)
        if (s.hands[s.turnPlayer - 1] == 0 && countPieces(s.board, s.turnPlayer) < 3) {
            s.phase = "GAME_OVER";
            emitEvent(matchId, "GAME_END", Map.of("winner", s.turnPlayer));
        }

        // Turn switch (unless in REMOVING phase until explicit removal confirmation)
        if (!"REMOVING".equals(s.phase)) {
            s.turnPlayer = s.turnPlayer == 1 ? 2 : 1;
        } else {
            // In MVP stub, REMOVING auto-resolves after opponent piece placed (simplified for flow)
            s.turnPlayer = s.turnPlayer == 1 ? 2 : 1;
            if (!hasFormedMill(s.board, attempt.to, s.turnPlayer)) { // Basic heuristic reset
                s.phase = "MOVING"; 
            }
        }

        s.seqId = currentSeq;
        rooms.put(matchId, s);
        
        return Map.of(
            "event", "STATE_UPDATE",
            "data", serializeState(s),
            "seq_id", currentSeq,
            "latency_ms", System.currentTimeMillis() - attempt.clientSeqId // RTT simulation fallback
        );
    }

    private boolean isAdjacentToOwnedPiece(GameState s, int target, int player) {
        // Adjacency list stub per spec topology
        List<Integer>[] adj = adjacencyList();
        for (int i : adj[target]) {
            if (s.board.getOrDefault(i, -1) == player) return true;
        }
        return false;
    }

    private boolean hasFormedMill(Map<Integer, Integer> board, int idx, int player) {
        List<List<Integer>> mills = List.of(
            List.of(0,1,2), List.of(3,4,5), List.of(6,7,8), List.of(9,10,11), // Outer/Mid rows
            List.of(12,13,14), List.of(15,16,17), List.of(18,19,20), // Simplified radial/inner
            List.of(0,8,16), List.of(1,9,17) // Radials stub
        );
        return mills.stream().anyMatch(m -> m.contains(idx) && m.stream().allMatch(p -> board.getOrDefault(p,-1)==player));
    }

    private int countPieces(Map<Integer, Integer> board, int player) {
        return (int) board.values().stream().filter(v -> v == player).count();
    }

    private List<Integer>[] adjacencyList() { /* Standard 24-point Morris topology stub */ return new ArrayList[24]; }

    private String serializeState(GameState s) throws JsonProcessingException {
        return jacksonMapper.writeValueAsString(s); // Explicit Jackson serialization fix for JSONB
    }

    private void emitEvent(String matchId, String type, Object payload) {
        // Kafka producer stub: kafkaTemplate.send("match-move", matchId, new GameEvent(type, payload))
        System.out.printf("[EVENT-EXPORT] match=%s type=%s payload=%s%n", matchId, type, payload);
    }

    private Map<String, Object> errorPayload(String msg) {
        return Map.of("event", "ERROR_RECOVERY", "message", msg);
    }
}