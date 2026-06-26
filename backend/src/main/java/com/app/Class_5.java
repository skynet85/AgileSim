package com.malmo.engine;

import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

public class NineMensMorrisEngine {
    public enum Player { BLACK, WHITE }
    public enum Phase { PLACING, MOVING, REMOVING, FINISHED }

    private final int[] board = new int[24]; // 0=empty, 1=BLACK, 2=WHITE
    private Player currentPlayer;
    private Phase phase;
    private Map<Player, Integer> piecesLeft;
    private final ReentrantLock gameLock = new ReentrantLock();

    private static final List<List<Integer>> ADJACENCY = initAdjacency();
    private static final List<List<Integer>> MILLS = initMills();

    public NineMensMorrisEngine(Player starter) {
        this.currentPlayer = starter;
        this.phase = Phase.PLACING;
        this.piecesLeft = new HashMap<>();
        this.piecesLeft.put(Player.BLACK, 9);
        this.piecesLeft.put(Player.WHITE, 9);
    }

    private static List<List<Integer>> initAdjacency() {
        Map<Integer, List<Integer>> map = new HashMap<>();
        int[][] adjPairs = {
            {0,1},{0,7},{1,2},{3,4},{5,6},{7,6},
            {8,9},{8,15},{9,10},{10,11},{11,12},{12,13},{13,14},{14,15},
            {16,17},{16,23},{17,18},{18,19},{19,20},{20,21},{21,22},{22,23}
        };
        int[][] crossPairs = {{1,9},{3,11},{5,13},{7,15},{9,17},{11,19},{13,21},{15,23}};
        
        for (int[] p : adjPairs) addBidir(map, p[0], p[1]);
        for (int[] p : crossPairs) addBidir(map, p[0], p[1]);
        
        return new ArrayList<>(map.values());
    }

    private static void addBidir(Map<Integer, List<Integer>> m, int u, int v) {
        m.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
        m.computeIfAbsent(v, k -> new ArrayList<>()).add(u);
    }

    private static List<List<Integer>> initMills() {
        return Arrays.asList(
            Arrays.asList(0,1,2), Arrays.asList(4,5,6), Arrays.asList(0,7,6), Arrays.asList(2,3,4),
            Arrays.asList(8,9,10), Arrays.asList(12,13,14), Arrays.asList(8,15,14), Arrays.asList(10,11,12),
            Arrays.asList(16,17,18), Arrays.asList(20,21,22), Arrays.asList(16,23,22), Arrays.asList(18,19,20),
            Arrays.asList(1,9,17), Arrays.asList(5,13,21), Arrays.asList(7,15,23), Arrays.asList(3,11,19)
        );
    }

    public synchronized boolean placePiece(int index, Player player) {
        gameLock.lock();
        try {
            if (board[index] != 0 || piecesLeft.get(player) <= 0) return false;
            board[index] = player.ordinal() + 1;
            piecesLeft.put(player, piecesLeft.get(player) - 1);
            
            if (isMillFormed(index, player)) {
                phase = Phase.REMOVING;
            } else {
                transitionPhase();
            }
            return true;
        } finally {
            gameLock.unlock();
        }
    }

    public synchronized boolean movePiece(int from, int to, Player player) {
        gameLock.lock();
        try {
            if (board[from] != player.ordinal() + 1 || board[to] != 0) return false;
            
            boolean canFly = piecesLeft.get(player) <= 3 && Arrays.stream(board).filter(v -> v == player.ordinal() + 1).count() == 3;
            if (!canFly && !ADJACENCY.get(from).contains(to)) return false;

            board[to] = board[from];
            board[from] = 0;

            if (isMillFormed(to, player)) {
                phase = Phase.REMOVING;
            } else {
                transitionPhase();
            }
            return true;
        } finally {
            gameLock.unlock();
        }
    }

    public synchronized boolean removePiece(int index, Player attacker) {
        gameLock.lock();
        try {
            int opponentVal = (attacker == Player.BLACK ? 2 : 1);
            if (board[index] != opponentVal) return false;
            
            List<Integer> mills = MILLS.stream().filter(m -> m.contains(index)).toList();
            boolean inProtectedMill = mills.stream()
                .anyMatch(m -> m.stream().allMatch(pos -> board[pos] == opponentVal));
            
            if (inProtectedMill && !isOnlyPieceInMills(index, opponentVal)) return false;

            board[index] = 0;
            int oppCount = Arrays.stream(board).filter(v -> v == opponentVal).count();
            if (oppCount < 4) {
                phase = Phase.FINISHED;
            } else {
                transitionPhase();
            }
            return true;
        } finally {
            gameLock.unlock();
        }
    }

    private boolean isMillFormed(int index, Player player) {
        int val = player.ordinal() + 1;
        return MILLS.stream().anyMatch(m -> m.contains(index) && m.stream().allMatch(p -> board[p] == val));
    }

    private boolean isOnlyPieceInMills(int idx, int val) {
        return MILLS.stream()
            .filter(m -> m.contains(idx))
            .noneMatch(m -> m.stream().anyMatch(p -> p != idx && board[p] == val));
    }

    private void transitionPhase() {
        boolean bothPlaced = piecesLeft.get(Player.BLACK) <= 0 && piecesLeft.get(Player.WHITE) <= 0;
        if (!bothPlaced) {
            currentPlayer = (currentPlayer == Player.BLACK ? Player.WHITE : Player.BLACK);
        } else {
            phase = Phase.MOVING;
        }
    }

    public int[] getBoard() { return board.clone(); }
    public Player getCurrentPlayer() { return currentPlayer; }
    public Phase getPhase() { return phase; }
}