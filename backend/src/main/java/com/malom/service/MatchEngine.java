package com.malom.service;

import lombok.Data;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MatchEngine {

    private static final Map<String, GameState> sessions = new ConcurrentHashMap<>();

    public record MoveRequest(String gameId, Integer from, Integer to) {}

    @Data
    public static class GameState {
        String id;
        List<String> board = Collections.nCopies(24, null);
        Player turn = Player.WHITE;
        Phase phase = Phase.PLACEMENT;
        Map<Player, Integer> hands = new HashMap<>(Map.of(Player.WHITE, 9, Player.BLACK, 9));
        Integer selectedPos = null;
        boolean removalMode = false;
        Player winner = null;
    }

    public enum Player { WHITE, BLACK }
    public enum Phase { PLACEMENT, MOVEMENT, FLYING, REMOVAL, GAME_OVER }

    private static final Map<Integer, List<Integer>> ADJACENCY = Map.of(
            0, List.of(1,7), 1, List.of(0,2,9), 2, List.of(1,3), 3, List.of(2,4,11),
            4, List.of(3,5), 5, List.of(4,6,13), 6, List.of(5,7), 7, List.of(0,6,15),
            8, List.of(9,14), 9, List.of(8,10,1), 10, List.of(9,11), 11, List.of(10,12,3),
            12, List.of(11,13), 13, List.of(12,14,5), 14, List.of(13,8), 15, List.of(14,7),
            16, List.of(17,22), 17, List.of(16,18,9), 18, List.of(17,19), 19, List.of(18,20,11),
            20, List.of(19,21), 21, List.of(20,22,13), 22, List.of(21,16,15), 23, List.of(22,20)
    );

    private static final List<List<Integer>> MILL_TRIPLES = Arrays.asList(
            List.of(0,1,2), List.of(2,3,4), List.of(4,5,6), List.of(6,7,0),
            List.of(8,9,10), List.of(10,11,12), List.of(12,13,14), List.of(14,15,8),
            List.of(16,17,18), List.of(18,19,20), List.of(20,21,22), List.of(22,23,16),
            List.of(1,9,17), List.of(3,11,19), List.of(5,13,21), List.of(7,15,23)
    );

    public GameState createSession() {
        String id = UUID.randomUUID().toString();
        sessions.put(id, new GameState());
        return sessions.get(id);
    }

    public GameState applyMove(String gameId, MoveRequest req) throws Exception {
        GameState state = sessions.computeIfAbsent(gameId, k -> createSession());
        
        if (state.winner != null || state.phase == Phase.GAME_OVER) throw new RuntimeException("Game already ended");

        List<String> board = new ArrayList<>(state.getBoard());

        // PLACEMENT PHASE
        if (state.getPhase() == Phase.PLACEMENT) {
            if (req.to() == null || req.from() != null) throw new IllegalArgumentException("Invalid placement request");
            if (board.get(req.to()) != null) throw new RuntimeException("Position occupied");
            
            board.set(req.to(), state.getTurn().name());
            int handsLeft = state.getHands().get(state.getTurn()) - 1;
            state.getHands().put(state.getTurn(), handsLeft);

            String oppName = state.getTurn() == Player.WHITE ? "BLACK" : "WHITE";
            if (checkWinCondition(board, oppName)) {
                state.setWinner(state.getTurn());
                state.setPhase(Phase.GAME_OVER);
                return state;
            }

            if (state.getHands().get(Player.WHITE) == 0 && state.getHands().get(Player.BLACK) == 0) {
                long wCount = board.stream().filter(p -> p.equals("WHITE")).count();
                long bCount = board.stream().filter(p -> p.equals("BLACK")).count();
                state.setPhase((wCount < 3 || bCount < 3) ? Phase.FLYING : Phase.MOVEMENT);
            }

            if (formsMill(board, state.getTurn().name())) {
                state.setRemovalMode(true);
            } else {
                switchTurn(state);
            }
        } 
        
        // MOVEMENT / FLYING PHASE
        else if (state.getPhase() == Phase.MOVEMENT || state.getPhase() == Phase.FLYING) {
            if (req.to() == null || req.from() == null) throw new IllegalArgumentException("Invalid move request");
            if (board.get(req.to()) != null) throw new RuntimeException("Position occupied");
            
            boolean isFlying = state.getPhase() == Phase.FLYING;
            boolean validMove = isFlying || ADJACENCY.getOrDefault(req.from(), List.of()).contains(req.to());
            if (!validMove) throw new RuntimeException("Invalid move: not adjacent or flying required");
            
            if (!board.get(req.from()).equals(state.getTurn().name())) {
                throw new RuntimeException("Cannot select opponent piece");
            }

            board.set(req.from(), null);
            board.set(req.to(), state.getTurn().name());

            String oppName = state.getTurn() == Player.WHITE ? "BLACK" : "WHITE";
            if (checkWinCondition(board, oppName)) {
                state.setWinner(state.getTurn());
                state.setPhase(Phase.GAME_OVER);
                return state;
            }

            if (formsMill(board, state.getTurn().name())) {
                state.setRemovalMode(true);
                state.setSelectedPos(null); 
            } else {
                switchTurn(state);
            }
        }

        // REMOVAL PHASE
        if (state.isRemovalMode() && req.to() != null) {
            String oppName = state.getTurn() == Player.WHITE ? "BLACK" : "WHITE";
            if (!board.get(req.to()).equals(oppName)) throw new RuntimeException("Invalid removal target");

            boolean isPieceInMill = MILL_TRIPLES.stream()
                .anyMatch(t -> t.contains(req.to()) && t.stream().allMatch(i -> board.get(i).equals(oppName)));
            
            if (isPieceInMill) {
                long totalOppPieces = board.stream().filter(p -> p.equals(oppName)).count();
                long piecesInMills = 0;
                for(int i=0; i<24; i++) {
                    if(board.get(i).equals(oppName)) {
                        boolean inMill = MILL_TRIPLES.stream()
                            .anyMatch(t -> t.contains(i) && t.stream().allMatch(j -> board.get(j).equals(oppName)));
                        if(inMill) piecesInMills++;
                    }
                }
                
                if (piecesInMills != totalOppPieces) {
                    throw new RuntimeException("Cannot remove piece from mill while non-mill pieces exist");
                }
            }

            board.set(req.to(), null);

            if (checkWinCondition(board, oppName)) {
                state.setWinner(state.getTurn());
                state.setPhase(Phase.GAME_OVER);
                return state;
            }
            
            state.setRemovalMode(false);
            switchTurn(state);
        }

        sessions.put(gameId, state);
        return state;
    }

    private boolean checkWinCondition(List<String> board, String player) {
        return board.stream().filter(x -> x.equals(player)).count() < 3;
    }

    private boolean formsMill(List<String> board, String color) {
        return MILL_TRIPLES.stream().anyMatch(t -> t.stream().allMatch(i -> board.get(i).equals(color)));
    }

    private void switchTurn(GameState s) {
        s.setTurn(s.getTurn() == Player.WHITE ? Player.BLACK : Player.WHITE);
        s.setRemovalMode(false);
        s.setSelectedPos(null);
    }

    public GameState getState(String gameId) { return sessions.getOrDefault(gameId, createSession()); }
}