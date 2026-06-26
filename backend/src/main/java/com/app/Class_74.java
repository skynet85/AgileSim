package com.malom.engine;

import lombok.Data;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MatchEngine {
    private static final int PIECES_PER_PLAYER = 9;
    
    public enum Phase { PLACEMENT, MOVEMENT, FLYING }

    @Data
    public static class State {
        private String turnPlayer;
        private int[] board; // 0: empty, 1: white, 2: black
        private int handWhite;
        private int handBlack;
        private Phase phase;

        public State() {
            this.board = new int[24];
            Arrays.fill(this.board, 0);
            this.turnPlayer = "white";
            this.handWhite = PIECES_PER_PLAYER;
            this.handBlack = PIECES_PER_PLAYER;
            this.phase = Phase.PLACEMENT;
        }

        public State copy() {
            State s = new State();
            s.board = Arrays.copyOf(this.board, 24);
            s.turnPlayer = this.turnPlayer;
            s.handWhite = this.handWhite;
            s.handBlack = this.handBlack;
            s.phase = this.phase;
            return s;
        }
    }

    private final int[][] ADJACENCY = {
        {0,1},{0,7}, {1,2},{1,9}, {2,3}, {3,4},{3,11}, {4,5}, {5,6},{5,13},
        {6,7}, {8,9},{8,14}, {9,10}, {10,11}, {11,12}, {12,13}, {13,14}, {14,15}
    };

    public State applyMove(State current, int fromIdx, int toIdx) {
        State next = current.copy();
        
        if (current.phase == Phase.PLACEMENT) {
            validatePlacement(next, toIdx);
        } else {
            boolean flying = countPieces(current, current.turnPlayer) < 3;
            if (!flying && !isAdjacent(fromIdx, toIdx)) throw new IllegalArgumentException("Invalid move");
            validateMovement(next, fromIdx, toIdx);
        }
        
        switchTurn(next);
        checkPhaseTransition(next);
        return next;
    }

    private void validatePlacement(State s, int idx) {
        if (s.board[idx] != 0) throw new IllegalArgumentException("Occupied");
        int player = "white".equals(s.turnPlayer) ? 1 : 2;
        s.board[idx] = player;
        if ("white".equals(s.turnPlayer)) s.handWhite--; else s.handBlack--;
    }

    private void validateMovement(State s, int from, int to) {
        if (s.board[from] == 0 || s.board[to] != 0) throw new IllegalArgumentException("Invalid coords");
        int player = "white".equals(s.turnPlayer) ? 1 : 2;
        s.board[to] = player;
        s.board[from] = 0;
    }

    private void switchTurn(State s) {
        s.turnPlayer = "white".equals(s.turnPlayer) ? "black" : "white";
    }

    private int countPieces(State s, String p) {
        int target = "white".equals(p) ? 1 : 2;
        return (int) Arrays.stream(s.board).filter(v -> v == target).count();
    }

    private boolean isAdjacent(int a, int b) {
        for (int[] pair : ADJACENCY) {
            if ((pair[0]==a && pair[1]==b) || (pair[0]==b && pair[1]==a)) return true;
        }
        return false;
    }

    private void checkPhaseTransition(State s) {
        if (s.handWhite == 0 && s.handBlack == 0) {
            boolean flying = countPieces(s, "white") < 3 || countPieces(s, "black") < 3;
            s.phase = flying ? Phase.FLYING : Phase.MOVEMENT;
        } else if (s.handWhite > 0 && s.handBlack > 0) {
            s.phase = Phase.PLACEMENT;
        }
    }
}