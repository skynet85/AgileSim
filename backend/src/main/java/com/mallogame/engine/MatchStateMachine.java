// File: backend/src/main/java/com/mallogame/engine/MatchStateMachine.java
package com.mallogame.engine;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MatchStateMachine {
    private final Map<String, GameState> matches = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messaging;
    private final MoveValidatorService validator;

    public MatchStateMachine(SimpMessagingTemplate messaging, MoveValidatorService validator) {
        this.messaging = messaging;
        this.validator = validator;
    }

    public void createMatch(String matchId, String playerW, String playerB) {
        GameState state = new GameState();
        state.setId(matchId);
        state.setTurn('w');
        state.setPhase("placement");
        state.setPiecesLeft(new HashMap<>(Map.of('w', 9, 'b', 9)));
        state.setBoard(new ArrayDeque<>(Collections.nCopies(24, null)));
        matches.put(matchId, state);
        broadcastSync(matchId);
    }

    public void processMove(String matchId, String userId, Integer fromIdx, int toIdx) {
        GameState state = matches.get(matchId);
        if (state == null || !state.getActivePlayer().equals(userId)) return; // Auth check

        try {
            switch (state.getPhase()) {
                case "placement" -> handlePlacement(state, userId, toIdx);
                case "movement", "flying" -> handleMove(state, userId, fromIdx, toIdx);
                case "remove" -> handleRemove(state, userId, toIdx);
            }
        } catch (Exception e) {
            messaging.convertAndSend("/topic/match/" + matchId + "/error", Map.of("message", e.getMessage()));
            return;
        }
        broadcastSync(matchId);
    }

    private void handlePlacement(GameState s, String userId, int toIdx) {
        if (s.getBoard().get(toIdx) != null) throw new RuntimeException("Pozíció foglalt");
        s.getBoard().set(toIdx, Character.valueOf(s.getActivePlayer()));
        s.getPiecesLeft().merge(s.getActivePlayer(), -1, Integer::sum);
        
        if (validator.hasFormedMill(s.getBoard(), toIdx, s.getActivePlayer())) {
            s.setPhase("remove");
            return; // Wait for remove move
        }
        switchTurnAndValidateLoss(s);
    }

    private void handleMove(GameState s, String userId, Integer fromIdx, int toIdx) {
        if (s.getBoard().get(fromIdx) == null || !Character.valueOf(s.getActivePlayer()).equals(s.getBoard().get(fromIdx))) 
            throw new RuntimeException("Nem a saját bábudat választottad");
        
        boolean isFlying = s.getPiecesOnBoard(s.getActivePlayer()) == 3;
        if (!isFlying && !validator.isAdjacent(fromIdx, toIdx)) throw new RuntimeException("Érvénytelen lépés");

        s.getBoard().set(toIdx, Character.valueOf(s.getActivePlayer()));
        s.getBoard().set(fromIdx, null);

        if (validator.hasFormedMill(s.getBoard(), toIdx, s.getActivePlayer())) {
            s.setPhase("remove");
            return;
        }
        
        // Check flying transition after move completes placement phase logic implicitly
        switchTurnAndValidateLoss(s);
    }

    private void handleRemove(GameState s, String userId, int removeIdx) {
        char opponent = s.getActivePlayer() == 'w' ? 'b' : 'w';
        if (s.getBoard().get(removeIdx) != null && Character.valueOf(opponent).equals(s.getBoard().get(removeIdx))) {
            if (!validator.canRemovePiece(s.getBoard(), removeIdx, opponent)) 
                throw new RuntimeException("Védett bábu levétele nem engedélyezett");
            
            s.getBoard().set(removeIdx, null);
            s.setScores(opponent == 'w' ? "scoreW" : "scoreB", ((Map<String,Integer>)s.getScores()).getOrDefault(opponent== 'w'?"scoreW":"scoreB",0)+1);
            // Simplified score tracking logic adjusted for brevity
            
            if (validator.checkWinCondition(s)) {
                s.setPhase("gameover");
                messaging.convertAndSend("/topic/match/" + s.getId() + "/gameover", Map.of("winner", userId));
                return;
            }
        } else throw new RuntimeException("Csak ellenfél bábut lehet levenni");

        switchTurnAndValidateLoss(s);
    }

    private void switchTurnAndValidateLoss(GameState s) {
        char oldPlayer = s.getActivePlayer();
        s.setTurn(oldPlayer == 'w' ? 'b' : 'w');
        
        if (s.getPiecesLeft().get('w') == 0 && s.getPiecesLeft().get('b') == 0) {
            // Transition to movement/flying logic handled by phase update in validator or next turn
            char current = s.getActivePlayer();
            int onBoard = countOnBoard(s.getBoard(), current);
            if (onBoard == 3) s.setPhase("flying");
            else s.setPhase("movement");
        }

        // Check loss condition: no pieces left to place, <3 on board, or blocked
        char nextPlayer = s.getActivePlayer();
        int nextOnBoard = countOnBoard(s.getBoard(), nextPlayer);
        
        if (s.getPiecesLeft().get('w') == 0 && s.getPiecesLeft().get('b') == 0) {
            if (nextOnBoard < 3 || !validator.hasAnyValidMoves(s.getBoard(), nextPlayer)) {
                s.setPhase("gameover");
                messaging.convertAndSend("/topic/match/" + s.getId() + "/gameover", Map.of("winner", String.valueOf(oldPlayer)));
                return;
            }
        }
    }

    private int countOnBoard(Deque<Character> board, char p) {
        return (int) board.stream().filter(c -> c != null && c == p).count();
    }

    public void broadcastSync(String matchId) {
        GameState s = matches.get(matchId);
        if (s != null) messaging.convertAndSend("/topic/match/" + matchId, s);
    }

    private static class GameState { /* Standard POJO with getId, setId, getBoard, setBoard, etc. Omitted for brevity */ 
        private String id; private char turn; private String phase; private Map<Character,Integer> piecesLeft = new HashMap<>();
        private Deque<Character> board = new ArrayDeque<>(Collections.nCopies(24, null));
        public String getId() { return id; } public void setId(String id) { this.id = id; }
        public char getActivePlayer() { return turn; } public void setTurn(char t) { this.turn = t; }
        public String getPhase() { return phase; } public void setPhase(String p) { this.phase = p; }
        public Map<Character, Integer> getPiecesLeft() { return piecesLeft; } public void setPiecesLeft(Map<Character, Integer> pl) { this.piecesLeft = pl; }
        public Deque<Character> getBoard() { return board; } public void setBoard(Deque<Character> b) { this.board = b; }
    }
}