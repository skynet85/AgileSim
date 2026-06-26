package com.malom.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameService {

    private final SimpMessagingTemplate messagingTemplate;
    
    // In-memory state machine. Determinisztikus, de sebezhető a reboot ellen. 
    // MVP szinten elfogadható kockázat, későbbi JSONB perzisztenciával helyettesítendő.
    private final ConcurrentHashMap<String, GameState> gameRooms = new ConcurrentHashMap<>();

    public void handleMove(String roomId, MoveRequest move) {
        log.info("[Control] Move request received: {} in room {}", move, roomId);
        
        GameState state = gameRooms.computeIfAbsent(roomId, k -> new GameState());
        
        // 1. Validate Move (Deterministic Rule Engine)
        if (!isValidMove(state, move)) {
            log.warn("[Chaos] Invalid move rejected: {}", move);
            return; // Silently drop or send error frame
        }

        // 2. Apply State Transition
        state.applyMove(move);
        
        // 3. Check for Mill & Capture Requirement
        boolean millDetected = checkMill(state, move.getCoords().getFrom());
        if (millDetected) {
            state.setPhase("capturing");
        } else if (state.isPlacingComplete()) {
            state.setPhase("moving");
        }

        // 4. Broadcast State Update to Client(s)
        GameStateUpdate update = new GameStateUpdate(
            state.getBoard(), 
            state.getPhase(), 
            state.getCurrentPlayer()
        );
        
        messagingTemplate.convertAndSend("/game/state/" + roomId, update);
        
        log.info("[Control] State synced. Phase: {}, Turn: {}", state.getPhase(), state.getCurrentPlayer());
    }

    private boolean isValidMove(GameState state, MoveRequest move) {
        // Simplified validation for MVP scope
        if (move.getPhase().equals("placing")) return true;
        
        int from = move.getCoords().getFrom();
        int to = move.getCoords().getTo();
        
        if (state.getBoard()[from] != state.getCurrentPlayer()) return false;
        // Adjacency check would go here in full implementation
        return true;
    }

    private boolean checkMill(GameState state, int index) {
        // Mill detection logic placeholder. 
        // In production: precomputed bitmasks for O(1) evaluation.
        return false; 
    }

    // Inner DTOs & State Model
    public record MoveRequest(String phase, Coords coords) {}
    public record Coords(Integer from, Integer to) {}
    
    public static class GameState {
        private int[] board = new int[24]; // 0=empty, 1=P1, 2=P2
        private String phase = "placing";
        private int currentPlayer = 1;

        public void applyMove(MoveRequest move) {
            if (move.phase().equals("placing")) {
                board[move.coords().place()] = currentPlayer;
            } else {
                board[move.coords().to()] = currentPlayer;
                board[move.coords().from()] = 0;
            }
            
            // Switch turn logic placeholder
            if (currentPlayer == 1) currentPlayer = 2;
            else currentPlayer = 1;
        }

        public boolean isPlacingComplete() {
            return Arrays.stream(board).filter(x -> x != 0).count() >= 9 && 
                   board[8] != 0; // Simplified heuristic for MVP
        }

        // Getters/Setters omitted for brevity, standard Lombok @Data applies in real impl.
        public int[] getBoard() { return board; }
        public String getPhase() { return phase; }
        public void setPhase(String phase) { this.phase = phase; }
        public int getCurrentPlayer() { return currentPlayer; }

    }
    
    public record GameStateUpdate(int[] board, String phase, int turn) {}
}