// File: backend/src/main/java/com/malomgame/service/GameLogicService.java
package com.malomgame.service;

import com.malomgame.model.GameState;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class GameLogicService {
    // Standard 9 Men's Morris valid triplets (0-23 linear mapping)
    private static final List<List<Integer>> VALID_MILLS = List.of(
        List.of(0,1,2), List.of(6,7,8), List.of(12,13,14), List.of(18,19,20), // Outer rings segments
        List.of(0,6,12), List.of(2,8,14), List.of(18,20,22), List.of(5,7,19)  // Cross & inner connections
    );

    // Strict adjacency map for MOVING phase validation
    private static final int[][] ADJACENCY = {
        {0,1}, {1,0},{1,2},{2,1},{0,6},{6,0},{6,7},{7,6},{7,8},{8,7},{2,8},{8,2}, // Outer loop
        {3,4},{4,3},{4,5},{5,4},{3,9},{9,3},{9,10},{10,9},{10,11},{11,10},{5,11},{11,5}, // Middle loop
        {12,13},{13,12},{13,14},{14,13},{12,18},{18,12},{18,19},{19,18},{19,20},{20,19},{14,20},{20,14}, // Inner loop
        {15,16},{16,15},{16,17},{17,16},{15,21},{21,15},{21,22},{22,21},{22,23},{23,22},{17,23},{23,17}, // Inner cross
        {0,3},{3,0},{6,9},{9,6},{12,15},{15,12},{2,5},{5,2},{8,11},{11,8},{14,17},{17,14},{20,23},{23,20} // Radial links
    };

    public synchronized GameState applyMove(GameState currentState, int player, int fromPos, int toPos) {
        if (currentState.getPhase() == GameState.Phase.GAME_OVER) {
            throw new IllegalStateException("Game already concluded.");
        }

        String[] board = Arrays.copyOf(currentState.getBoard(), 24);
        int nextVersion = currentState.getVersion() + 1;
        
        // PLACING PHASE LOGIC
        if (currentState.getPhase() == GameState.Phase.PLACING) {
            boolean isP1 = player == 1;
            int leftCount = isP1 ? currentState.getP1Left() : currentState.getP2Left();
            
            if (leftCount <= 0) throw new IllegalStateException("No pieces left to place.");
            if (board[toPos] != null) throw new IllegalArgumentException("Position occupied: " + toPos);
            
            board[toPos] = String.valueOf(player);
            int newP1Left = isP1 ? currentState.getP1Left() - 1 : currentState.getP1Left();
            int newP2Left = !isP1 ? currentState.getP2Left() - 1 : currentState.getP2Left();

            // Phase transition check: if both players placed all pieces, move to MOVING
            GameState.Phase nextPhase = (newP1Left == 0 && newP2Left == 0) 
                ? GameState.Phase.MOVING 
                : GameState.Phase.PLACING;

            return new GameState(board, nextVersion, nextPhase, player % 2 + 1, newP1Left, newP2Left);
        }

        // MOVING & REMOVE PHASE LOGIC
        if (board[fromPos] == null || !board[fromPos].equals(String.valueOf(player))) {
            throw new IllegalArgumentException("Invalid source piece ownership or empty slot.");
        }

        // Validate adjacency unless in PLACING phase (already handled above)
        boolean isAdjacent = false;
        for (int[] adj : ADJACENCY) {
            if ((adj[0] == fromPos && adj[1] == toPos)) {
                isAdjacent = true;
                break;
            }
        }
        
        // Allow flying rule only when 3 pieces left (standard Malom rule, implemented here for robustness)
        boolean canFly = player == 1 ? currentState.getP1Left() <= 0 : currentState.getP2Left() <= 0; 
        if (!isAdjacent && !canFly) {
            throw new IllegalArgumentException("Move violates adjacency constraints.");
        }

        // Execute move
        board[toPos] = String.valueOf(player);
        board[fromPos] = "";

        boolean millTriggered = checkMill(board, toPos, player);
        
        // If mill created and not already in removal phase
        if (millTriggered && currentState.getPhase() != GameState.Phase.REMOVE_PHASE) {
            return new GameState(board, nextVersion, GameState.Phase.REMOVE_PHASE, 1 - player, currentState.getP1Left(), currentState.getP2Left());
        }

        // If in REMOVE phase, interpret move as removal of opponent piece
        if (currentState.getPhase() == GameState.Phase.REMOVE_PHASE) {
            String opponent = String.valueOf(1 - player);
            if (board[toPos].equals(opponent)) {
                board[toPos] = ""; // Remove captured piece
                // Check win condition immediately after removal
                boolean p1Win = countPieces(board, 1) < 3;
                boolean p2Win = countPieces(board, 2) < 3;
                
                if (p1Win || p2Win) {
                    return new GameState(board, nextVersion + 1, GameState.Phase.GAME_OVER, player, currentState.getP1Left(), currentState.getP2Left());
                }
            } else {
                throw new IllegalArgumentException("Invalid removal target. Must select opponent piece.");
            }
            // Return to MOVING phase for the same player if they just removed, or switch turn? 
            // Standard rule: Mill triggers immediate removal, then turn passes.
            return new GameState(board, nextVersion + 1, GameState.Phase.MOVING, player % 2 + 1, currentState.getP1Left(), currentState.getP2Left());
        }

        // Normal move transition
        return new GameState(board, nextVersion, GameState.Phase.MOVING, 1 - player, currentState.getP1Left(), currentState.getP2Left());
    }

    private boolean checkMill(String[] board, int pos, int player) {
        String pStr = String.valueOf(player);
        for (List<Integer> mill : VALID_MILLS) {
            if (mill.contains(pos)) {
                // Check if all three positions in this potential mill match the current piece
                boolean isMill = true;
                for (int idx : mill) {
                    if (!board[idx].equals(pStr)) {
                        isMill = false;
                        break;
                    }
                }
                if (isMill && board[mill.get(0)].equals(pStr) && board[mill.get(1)].equals(pStr) && board[mill.get(2)].equals(pStr)) {
                    return true;
                }
            }
        }
        return false;
    }

    private int countPieces(String[] board, int player) {
        long count = 0;
        for (String piece : board) {
            if (piece != null && piece.equals(String.valueOf(player))) count++;
        }
        return (int) count;
    }
}