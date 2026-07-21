package com.malm.game.service;

import com.malm.game.model.GameStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class GameService {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private String phase = "PLACING";
    private String currentPlayer = "P1";
    private List<String> board = new ArrayList<>(Collections.nCopies(24, ""));
    private int p1PiecesLeft = 9;
    private int p2PiecesLeft = 9;
    private String winner = null;

    private static final Map<Integer, List<Integer>> ADJACENCY = new HashMap<>();
    static {
        ADJACENCY.put(0, Arrays.asList(1, 3)); ADJACENCY.put(1, Arrays.asList(0, 2, 6)); ADJACENCY.put(2, Arrays.asList(1, 4));
        ADJACENCY.put(3, Arrays.asList(0, 5, 9)); ADJACENCY.put(4, Arrays.asList(2, 5, 7)); ADJACENCY.put(5, Arrays.asList(3, 4, 6, 8));
        ADJACENCY.put(6, Arrays.asList(1, 5, 10)); ADJACENCY.put(7, Arrays.asList(4, 8, 12)); ADJACENCY.put(8, Arrays.asList(5, 7, 9, 11));
        ADJACENCY.put(9, Arrays.asList(3, 8, 13)); ADJACENCY.put(10, Arrays.asList(6, 8, 14)); ADJACENCY.put(11, Arrays.asList(8, 12, 15));
        ADJACENCY.put(12, Arrays.asList(7, 11, 13, 19)); ADJACENCY.put(13, Arrays.asList(9, 12, 16)); ADJACENCY.put(14, Arrays.asList(10, 15, 17));
        ADJACENCY.put(15, Arrays.asList(11, 14, 18)); ADJACENCY.put(16, Arrays.asList(13, 17, 22)); ADJACENCY.put(17, Arrays.asList(14, 16, 23));
        ADJACENCY.put(18, Arrays.asList(15, 19, 21)); ADJACENCY.put(19, Arrays.asList(12, 18, 20)); ADJACENCY.put(20, Arrays.asList(19, 21, 23));
        ADJACENCY.put(21, Arrays.asList(18, 20, 22)); ADJACENCY.put(22, Arrays.asList(16, 21, 23)); ADJACENCY.put(23, Arrays.asList(17, 20, 22));
    }

    private static final List<List<Integer>> MILLS = Arrays.asList(
        Arrays.asList(0,1,2), Arrays.asList(3,4,5), Arrays.asList(6,7,8),
        Arrays.asList(9,10,11), Arrays.asList(12,13,14), Arrays.asList(15,16,17),
        Arrays.asList(18,19,20), Arrays.asList(21,22,23),
        Arrays.asList(1,4,7), Arrays.asList(4,10,13), Arrays.asList(7,16,19),
        Arrays.asList(2,5,8), Arrays.asList(5,11,14), Arrays.asList(8,17,20)
    );

    public GameStatus getStatus() {
        lock.readLock().lock();
        try {
            List<String> boardCopy = new ArrayList<>(board);
            return new GameStatus(phase, currentPlayer, boardCopy, p1PiecesLeft, p2PiecesLeft, winner);
        } finally {
            lock.readLock().unlock();
        }
    }

    public GameStatus applyMove(Integer from, Integer to) {
        lock.writeLock().lock();
        try {
            if (winner != null) return getStatus();

            if ("PLACING".equals(phase)) {
                if (to == null || !board.get(to).isEmpty()) throw new IllegalArgumentException("Invalid placement target");
                board.set(to, currentPlayer);
                boolean millCreated = checkMill(currentPlayer, to);

                if (currentPlayer.equals("P1")) p1PiecesLeft--; else p2PiecesLeft--;

                if (p1PiecesLeft == 0 && p2PiecesLeft == 0) {
                    phase = "MOVING";
                    switchTurn();
                } else {
                    if (!millCreated) switchTurn();
                }
            } else {
                // MOVING PHASE
                if (from == null || board.get(from).isEmpty() || !board.get(from).equals(currentPlayer)) throw new IllegalArgumentException("Invalid source");
                if (to == null || !board.get(to).isEmpty()) throw new IllegalArgumentException("Invalid target");

                boolean isFly = currentPlayer.equals("P1") ? p1PiecesLeft < 3 : p2PiecesLeft < 3;
                if (!isFly) {
                    List<Integer> adj = ADJACENCY.getOrDefault(from, Collections.emptyList());
                    if (!adj.contains(to)) throw new IllegalArgumentException("Invalid move: not adjacent");
                }

                board.set(to, currentPlayer);
                board.set(from, "");
                
                boolean millCreated = checkMill(currentPlayer, to);
                if (millCreated) { /* Stay on current player for removal */ } else switchTurn();
            }

            // Win condition: < 3 pieces OR no valid moves. Simplified MVP: piece count
            if (p1PiecesLeft < 3 && p2PiecesLeft >= 0) winner = "P2";
            else if (p2PiecesLeft < 3 && p1PiecesLeft >= 0) winner = "P1";

            return getStatus();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public GameStatus applyRemoval(Integer to) {
        lock.writeLock().lock();
        try {
            if (winner != null) return getStatus();
            String opponent = currentPlayer.equals("P1") ? "P2" : "P1";
            if (to == null || !opponent.equals(board.get(to))) throw new IllegalArgumentException("Invalid removal target");

            boolean inMill = false;
            for(List<Integer> m : MILLS) {
                if(m.contains(to) && board.get(m.get(0)).equals(opponent) && 
                   board.get(m.get(1)).equals(opponent) && board.get(m.get(2)).equals(opponent)) {
                    inMill = true; break;
                }
            }

            if(inMill) {
                boolean allInMills = true;
                for(int i=0;i<24;i++) {
                    if(board.get(i).equals(opponent)) {
                        boolean pInMill = false;
                        for(List<Integer> m : MILLS) {
                            if(m.contains(i) && board.get(m.get(0)).equals(opponent) && 
                               board.get(m.get(1)).equals(opponent) && board.get(m.get(2)).equals(opponent)) {
                                pInMill = true; break;
                            }
                        }
                        if(!pInMill) allInMills = false;
                    }
                }
                if(!allInMills) throw new IllegalArgumentException("Cannot remove piece from mill");
            }

            board.set(to, "");
            switchTurn();
            return getStatus();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void switchTurn() {
        currentPlayer = currentPlayer.equals("P1") ? "P2" : "P1";
    }

    private boolean checkMill(String player, int index) {
        for(List<Integer> m : MILLS) {
            if(m.contains(index)) {
                if(board.get(m.get(0)).equals(player) && 
                   board.get(m.get(1)).equals(player) && board.get(m.get(2)).equals(player)) return true;
            }
        }
        return false;
    }

    public void reset() {
        lock.writeLock().lock();
        try {
            phase = "PLACING"; currentPlayer = "P1";
            board = new ArrayList<>(Collections.nCopies(24, ""));
            p1PiecesLeft = 9; p2PiecesLeft = 9; winner = null;
        } finally { lock.writeLock().unlock(); }
    }
}