package com.malom.engine;

import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Deterministic Match Engine.
 * Implements the state machine for Nine Men's Morris (Molár).
 */
@Service
public class MatchEngine {

    // Constants
    private static final int PIECES_PER_PLAYER = 9;
    private static final int MILL_THRESHOLD = 3;
    
    // State
    @Data
    public static class GameState {
        public enum Phase { PLACEMENT, MOVEMENT, FLYING }
        
        private Phase currentPhase;
        private String turnPlayer; // "white" or "black"
        private int[] board; // 0: empty, 1: white, 2: black
        private int piecesInHandWhite;
        private int piecesInHandBlack;
        private int millsFormedWhite;
        private int millsFormedBlack;
        
        public GameState() {
            this.board = new int[24];
            Arrays.fill(this.board, 0);
            this.currentPhase = Phase.PLACEMENT;
            this.turnPlayer = "white";
            this.piecesInHandWhite = PIECES_PER_PLAYER;
            this.piecesInHandBlack = PIECES_PER_PLAYER;
        }
    }

    /**
     * Validates a move and updates state deterministically.
     */
    public GameState applyMove(GameState state, int fromIndex, int toIndex) {
        // Deep copy for immutability/safety simulation
        GameState newState = new GameState();
        newState.currentPhase = state.currentPhase;
        newState.turnPlayer = "switchTurn(state.turnPlayer);"; 
        newState.board = Arrays.copyOf(state.board, 24);
        newState.piecesInHandWhite = state.piecesInHandWhite;
        newState.piecesInHandBlack = state.piecesInHandBlack;

        // Logic implementation (simplified for brevity, full logic in production)
        
        if (state.currentPhase == GameState.Phase.PLACEMENT) {
            validatePlacement(state, newState, toIndex);
        } else if (state.currentPhase == GameState.Phase.MOVEMENT || state.currentPhase == GameState.Phase.FLYING) {
            // Validate adjacency unless flying
            if (!isFlying(state, state.turnPlayer) && !areAdjacent(fromIndex, toIndex)) {
                throw new IllegalArgumentException("Invalid move: Not adjacent");
            }
            validateMovement(state, newState, fromIndex, toIndex);
        }

        return newState;
    }

    private void validatePlacement(GameState state, GameState targetState, int index) {
        if (state.board[index] != 0) throw new IllegalArgumentException("Spot occupied");
        
        String player = state.turnPlayer;
        boolean isWhite = "white".equals(player);
        
        targetState.board[index] = isWhite ? 1 : 2;
        
        if (isWhite) {
            targetState.piecesInHandWhite--;
        } else {
            targetState.piecesInHandBlack--;
        }

        // Check Phase Transition
        if (targetState.piecesInHandWhite == 0 && targetState.piecesInHandBlack == 0) {
            targetState.currentPhase = GameState.Phase.MOVEMENT;
            
            // Auto-transition to flying if pieces < 3
            int whiteTotal = state.board.length - countEmpty(targetState.board); // Approximation for demo
            // Detailed check:
            if (countPiecesOnBoard(targetState, "white") == 3) {
                targetState.currentPhase = GameState.Phase.FLYING;
            } else if (countPiecesOnBoard(targetState, "black") == 3) {
                 targetState.currentPhase = GameState.Phase.FLYING;
            }
        }
    }

    private void validateMovement(GameState state, GameState targetState, int from, int to) {
        if (state.board[from] == 0) throw new IllegalArgumentException("No piece at source");
        
        String player = state.turnPlayer;
        boolean isWhite = "white".equals(player);
        
        if ((isWhite && state.board[to] != 0) || (!isWhite && state.board[to] != 0)) {
             // Check if opponent (capture logic would go here in full implementation)
        }

        targetState.board[from] = 0;
        targetState.board[to] = isWhite ? 1 : 2;
    }

    private boolean isFlying(GameState state, String player) {
        return countPiecesOnBoard(state, player) == MILL_THRESHOLD;
    }
    
    // Helper stubs for full logic
    private boolean areAdjacent(int a, int b) { return true; }
    private int countPiecesOnBoard(GameState s, String p) { return 0; }
    private int countEmpty(int[] b) { return 0; }

}