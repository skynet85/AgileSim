package com.malom.engine;

import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MatchEngine {

    private static final int PIECES_PER_PLAYER = 9;
    private static final int MILL_THRESHOLD = 3;

    public enum Phase { PLACEMENT, MOVEMENT, FLYING }

    @Data
    public static class GameState {
        private Phase currentPhase;
        private String turnPlayer;
        private int[] board;
        private int piecesInHandWhite;
        private int piecesInHandBlack;
        private boolean removalMode;
        
        public GameState() {
            this.board = new int[24];
            Arrays.fill(this.board, 0);
            this.currentPhase = Phase.PLACEMENT;
            this.turnPlayer = "white";
            this.piecesInHandWhite = PIECES_PER_PLAYER;
            this.piecesInHandBlack = PIECES_PER_PLAYER;
        }

        public GameState copy() {
            GameState copy = new GameState();
            copy.currentPhase = this.currentPhase;
            copy.turnPlayer = this.turnPlayer;
            copy.board = Arrays.copyOf(this.board, 24);
            copy.piecesInHandWhite = this.piecesInHandWhite;
            copy.piecesInHandBlack = this.piecesInHandBlack;
            copy.removalMode = this.removalMode;
            return copy;
        }
    }

    public GameState applyMove(GameState state, int fromIndex, int toIndex) {
        GameState newState = state.copy();

        if (state.currentPhase == Phase.PLACEMENT) {
            validatePlacement(state, newState, toIndex);
        } else {
            boolean isFlying = countPiecesOnBoard(newState, state.turnPlayer) == MILL_THRESHOLD;
            if (!isFlying && !areAdjacent(fromIndex, toIndex)) {
                throw new IllegalArgumentException("Invalid move: Not adjacent");
            }
            validateMovement(state, newState, fromIndex, toIndex);
        }

        switchTurn(newState);
        return newState;
    }

    private void validatePlacement(GameState state, GameState target, int index) {
        if (state.board[index] != 0) throw new IllegalArgumentException("Spot occupied");
        
        boolean isWhite = "white".equals(state.turnPlayer);
        target.board[index] = isWhite ? 1 : 2;
        
        if (isWhite) {
            target.piecesInHandWhite--;
        } else {
            target.piecesInHandBlack--;
        }

        if (target.piecesInHandWhite == 0 && target.piecesInHandBlack == 0) {
            target.currentPhase = Phase.MOVEMENT;
            if (countPiecesOnBoard(target, "white") == MILL_THRESHOLD || countPiecesOnBoard(target, "black") == MILL_THRESHOLD) {
                target.currentPhase = Phase.FLYING;
            }
        }
    }

    private void validateMovement(GameState state, GameState target, int from, int to) {
        if (state.board[from] == 0 || state.board[to] != 0) throw new IllegalArgumentException("Invalid move coordinates");
        
        boolean isWhite = "white".equals(state.turnPlayer);
        target.board[to] = isWhite ? 1 : 2;
        target.board[from] = 0;
    }

    private void switchTurn(GameState state) {
        state.turnPlayer = "white".equals(state.turnPlayer) ? "black" : "white";
    }

    public int countPiecesOnBoard(GameState s, String player) {
        int count = 0;
        boolean isWhite = "white".equals(player);
        for (int b : s.board) {
            if ((isWhite && b == 1) || (!isWhite && b == 2)) count++;
        }
        return count;
    }

    private boolean areAdjacent(int a, int b) {
        int[][] adj = {{0,1},{0,7},{1,2},{1,9},{2,3},{3,4},{3,11},{4,5},{5,6},{5,13},{6,7},{7,15},
                       {8,9},{8,14},{9,10},{10,11},{11,12},{12,13},{13,14},{14,15}};
        for (int[] pair : adj) {
            if ((pair[0] == a && pair[1] == b) || (pair[0] == b && pair[1] == a)) return true;
        }
        return false;
    }
}