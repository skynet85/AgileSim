// File: backend/src/main/java/com/mallogame/service/MoveValidatorService.java
package com.mallogame.service;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MoveValidatorService {
    // Adjacency matrix for 24 positions
    private static final int[][] ADJ = {
        {1,7}, {0,2,9}, {1,3}, {2,4,11}, {3,5}, {4,6,13}, {5,7}, {0,6,15},
        {9,15}, {8,10,1,17}, {9,11}, {10,12,3,19}, {11,13}, {12,14,5,21}, {13,15}, {8,14,7,23},
        {17,23}, {16,18,9}, {17,19}, {18,20,11}, {19,21}, {20,22,13}, {21,23}, {15,16,22}
    };

    private static final List<List<Integer>> MILLS = Arrays.asList(
        Arrays.asList(0,1,2), Arrays.asList(4,5,6), Arrays.asList(2,3,4), Arrays.asList(6,7,0),
        Arrays.asList(8,9,10), Arrays.asList(12,13,14), Arrays.asList(10,11,12), Arrays.asList(8,14,15),
        Arrays.asList(16,17,18), Arrays.asList(20,21,22), Arrays.asList(18,19,20), Arrays.asList(16,22,23),
        Arrays.asList(1,9,17), Arrays.asList(3,11,19), Arrays.asList(5,13,21), Arrays.asList(7,15,23)
    );

    public boolean isAdjacent(int from, int to) {
        for (int neighbor : ADJ[from]) if (neighbor == to) return true;
        return false;
    }

    public boolean hasFormedMill(List<Character> board, int pos, char player) {
        return MILLS.stream().anyMatch(mill -> mill.contains(pos) && mill.stream().allMatch(p -> board.get(p) != null && board.get(p) == player));
    }

    public boolean canRemovePiece(List<Character> board, int idx, char opponent) {
        // If all opponent pieces are in mills, any can be removed. Otherwise only non-mill ones.
        List<Integer> oppPositions = new ArrayList<>();
        for(int i=0; i<board.size(); i++) if(board.get(i)==opponent) oppPositions.add(i);
        
        Set<Integer> inMill = new HashSet<>();
        MILLS.forEach(m -> { if(m.stream().allMatch(p-> board.get(p)!=null && board.get(p)==opponent)) m.forEach(inMill::add); });
        
        if (inMill.size() == oppPositions.size()) return true; // All protected
        return !inMill.contains(idx); // Must not be in mill unless all are
    }

    public boolean hasAnyValidMoves(List<Character> board, char player) {
        List<Integer> pieces = new ArrayList<>();
        for(int i=0; i<board.size(); i++) if(board.get(i)==player) pieces.add(i);
        
        // Flying rule: 3 pieces left -> can fly anywhere empty
        int onBoard = pieces.size();
        if (onBoard == 3) return board.stream().anyMatch(p -> p == null);

        for(int pos : pieces) {
            for(int next : ADJ[pos]) {
                if(board.get(next)==null) return true;
            }
        }
        return false;
    }

    public boolean checkWinCondition(GameState state) { /* Implemented in engine logic */ return false; }
}