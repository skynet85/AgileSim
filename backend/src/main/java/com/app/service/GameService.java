package com.app.service;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final Map<String, List<String>> boards = new ConcurrentHashMap<>();
    private final Map<String, Integer> turns = new ConcurrentHashMap<>();
    private final Map<String, int[]> piecesPlaced = new ConcurrentHashMap<>(); 
    private final Map<String, String> gamePhases = new ConcurrentHashMap<>();

    private static final List<List<Integer>> ADJACENCY = Arrays.asList(
        Arrays.asList(1, 7), Arrays.asList(0, 2), Arrays.asList(1, 3), Arrays.asList(2, 4),
        Arrays.asList(3, 5, 12), Arrays.asList(4, 6, 13), Arrays.asList(5, 7), Arrays.asList(6, 0, 15),
        Arrays.asList(9, 15), Arrays.asList(8, 10), Arrays.asList(9, 11), Arrays.asList(10, 12),
        Arrays.asList(11, 13, 4), Arrays.asList(12, 14, 5), Arrays.asList(13, 15), Arrays.asList(14, 8, 7),
        Arrays.asList(17, 23), Arrays.asList(16, 18), Arrays.asList(17, 19), Arrays.asList(18, 20),
        Arrays.asList(19, 21), Arrays.asList(20, 22), Arrays.asList(21, 23), Arrays.asList(22, 16)
    );

    private static final List<List<Integer>> MILL_PATTERNS = Arrays.asList(
        Arrays.asList(0,1,2), Arrays.asList(1,2,3), Arrays.asList(4,5,6), Arrays.asList(5,6,7),
        Arrays.asList(8,9,10), Arrays.asList(9,10,11), Arrays.asList(12,13,14), Arrays.asList(13,14,15),
        Arrays.asList(16,17,18), Arrays.asList(17,18,19), Arrays.asList(20,21,22), Arrays.asList(21,22,23),
        Arrays.asList(0,8,16), Arrays.asList(4,12,20), Arrays.asList(5,13,21), Arrays.asList(7,15,23)
    );

    public String createGame() {
        String gameId = UUID.randomUUID().toString();
        List<String> initialBoard = new ArrayList<>(Collections.nCopies(24, null));
        boards.put(gameId, initialBoard); 
        turns.put(gameId, 1); 
        piecesPlaced.put(gameId, new int[]{0, 0}); 
        gamePhases.put(gameId, "PLACING");
        return gameId;
    }

    public com.app.dto.GameResponse makeMove(String gameId, int fromIndex, int toIndex) {
        long startNs = System.nanoTime();
        List<String> board = boards.get(gameId); 
        if (board == null) throw new IllegalArgumentException("Játék nem található.");
        
        Integer currentPlayerObj = turns.getOrDefault(gameId, 1);
        if (currentPlayerObj == null) throw new IllegalStateException("Hiányzó játékos állapot.");
        int currentPlayer = currentPlayerObj;
        
        int[] placedCount = piecesPlaced.getOrDefault(gameId, new int[]{0, 0});
        boolean isPhase1 = placedCount[0] < 9 || placedCount[1] < 9;
        String phase = isPhase1 ? "PLACING" : "MOVING";

        if (fromIndex < 0 || fromIndex >= 24 || toIndex < 0 || toIndex >= 24) { 
            logMetric(gameId, "INVALID_INDEX"); 
            return new com.app.dto.GameResponse(gameId, board, currentPlayer, phase, "Érvénytelen index. 0-23 tartomány kötelező."); 
        }
        
        String playerStr = String.valueOf(currentPlayer);
        if (board.get(toIndex) != null) { 
            logMetric(gameId, "TARGET_OCCUPIED"); 
            return new com.app.dto.GameResponse(gameId, board, currentPlayer, phase, "A célpont már foglalt."); 
        }

        List<Integer> neighbors = ADJACENCY.get(fromIndex); 
        boolean isAdjacent = neighbors.contains(toIndex);
        
        boolean canFly = placedCount[currentPlayer - 1] == 3 && !isPhase1;
        
        if (board.get(fromIndex) == null || !board.get(fromIndex).equals(playerStr)) { 
            logMetric(gameId, "INVALID_SOURCE"); 
            return new com.app.dto.GameResponse(gameId, board, currentPlayer, phase, "Nem a te bábod ezt a mezőt."); 
        }
        
        if (!canFly && !isAdjacent) { 
            logMetric(gameId, "NON_ADJACENT_MOVE"); 
            return new com.app.dto.GameResponse(gameId, board, currentPlayer, phase, "Csak szomszédos üres mezőre mozoghatsz (vagy repülhetsz ha 3 bábad van)."); 
        }

        board.set(fromIndex, null); 
        board.set(toIndex, playerStr);
        
        int[] newPlaced = Arrays.copyOf(placedCount, 2);
        if (isPhase1) { 
            newPlaced[currentPlayer - 1]++; 
            piecesPlaced.put(gameId, newPlaced); 
        }

        boolean formedMill = checkMill(board, toIndex, playerStr); 
        String statusMsg = "Lépés elfogadva.";
        
        if (formedMill) { 
            List<String> opponentPieces = getOpponentPieces(board, currentPlayer == 1 ? "2" : "1"); 
            gamePhases.put(gameId, "CAPTURE_WAIT"); 
            statusMsg += " Malmot zártál! Válassz ellenfél bábát a kikapáshoz."; 
            logMetric(gameId, "MILL_FORMED_CAPTURE_PENDING"); 
        }

        int nextPlayer = currentPlayer == 1 ? 2 : 1; 
        turns.put(gameId, nextPlayer);
        
        long durationMs = (System.nanoTime() - startNs) / 1_000_000; 
        logMetric(gameId, "MOVE_EXECUTED", durationMs);
        
        return new com.app.dto.GameResponse(gameId, board, nextPlayer, gamePhases.getOrDefault(gameId, phase), statusMsg);
    }

    public void capturePiece(String gameId, int pieceIndex) {
        List<String> board = boards.get(gameId); 
        if (board == null || board.size() != 24) throw new IllegalArgumentException("Hibás játékállapot.");
        
        String phase = gamePhases.getOrDefault(gameId, ""); 
        if (!"CAPTURE_WAIT".equals(phase)) throw new IllegalStateException("Nincs kikapási fázis folyamatban.");
        
        int currentPlayer = turns.getOrDefault(gameId, 1); 
        String opponentStr = currentPlayer == 1 ? "2" : "1";
        
        if (pieceIndex < 0 || pieceIndex >= board.size() || !opponentStr.equals(board.get(pieceIndex))) {
            throw new IllegalArgumentException("Csak ellenfél bábáját kapkodhatod ki.");
        }

        board.set(pieceIndex, null); 
        
        gamePhases.put(gameId, "MOVING"); 
        logMetric(gameId, "CAPTURE_COMPLETED");
    }

    private boolean checkMill(List<String> board, int idx, String player) {
        for (List<Integer> pattern : MILL_PATTERNS) {
            if (pattern.contains(idx) && 
                board.get(pattern.get(0)).equals(player) && 
                board.get(pattern.get(1)).equals(player) && 
                board.get(pattern.get(pattern.size() - 1)).equals(player)) {
                return true;
            }
        }
        return false;
    }

    private List<String> getOpponentPieces(List<String> board, String opponentStr) { 
        List<String> pieces = new ArrayList<>(); 
        for (int i = 0; i < board.size(); i++) if (opponentStr.equals(board.get(i))) pieces.add(String.valueOf(i)); 
        return pieces; 
    }
    
    public List<String> getBoard(String gameId) { 
        return boards.getOrDefault(gameId, new ArrayList<>(Collections.nCopies(24, null))); 
    }

    private void logMetric(String gameId, String event) { 
        System.out.printf("[ANALYTICS] [%s] %s%n", gameId.substring(0, Math.min(gameId.length(), 8)), event); 
    }
    
    private void logMetric(String gameId, String event, long ms) { 
        System.out.printf("[ANALYTICS] [%s] %s | %.2fms%n", gameId.substring(0, Math.min(gameId.length(), 8)), event, (double)ms); 
    }
}