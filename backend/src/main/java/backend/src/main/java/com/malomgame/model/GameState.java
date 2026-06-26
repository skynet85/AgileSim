// File: backend/src/main/java/com/malomgame/model/GameState.java
package com.malomgame.model;

import java.util.Arrays;

public class GameState {
    public enum Phase { PLACING, MOVING, REMOVE_PHASE, GAME_OVER }

    private final String[] board; // Immutable snapshot
    private final int version;
    private final Phase phase;
    private final int currentTurn; // 1 or 2
    private final int p1Left;
    private final int p2Left;

    public GameState(String[] board, int version, Phase phase, int currentTurn, int p1Left, int p2Left) {
        this.board = Arrays.copyOf(board, board.length); // Enforce immutability contract
        this.version = version;
        this.phase = phase;
        this.currentTurn = currentTurn;
        this.p1Left = p1Left;
        this.p2Left = p2Left;
    }

    public String[] getBoard() { return board; }
    public int getVersion() { return version; }
    public Phase getPhase() { return phase; }
    public int getCurrentTurn() { return currentTurn; }
    public int getP1Left() { return p1Left; }
    public int getP2Left() { return p2Left; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GameState)) return false;
        GameState that = (GameState) o;
        return version == that.version && 
               currentTurn == that.currentTurn && 
               Arrays.equals(board, that.board);
    }

    @Override
    public int hashCode() {
        int result = Arrays.hashCode(board);
        result = 31 * result + version;
        result = 31 * result + currentTurn;
        return result;
    }
}