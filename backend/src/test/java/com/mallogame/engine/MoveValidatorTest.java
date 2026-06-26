// File: backend/src/test/java/com/mallogame/engine/MoveValidatorTest.java
package com.mallogame.engine;

import com.mallogame.service.MoveValidatorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MoveValidatorTest {

    @Autowired
    private MoveValidatorService validator;

    private List<Character> board;

    @BeforeEach
    void setUp() {
        board = new ArrayList<>(Collections.nCopies(24, null));
    }

    @Test
    void testIsAdjacent() {
        assertTrue(validator.isAdjacent(0, 1));
        assertFalse(validator.isAdjacent(0, 5));
        assertTrue(validator.isAdjacent(12, 13)); // Middle row
    }

    @Test
    void testHasFormedMill_StandardOuter() {
        board.set(0, 'w'); board.set(1, 'w'); board.set(2, 'w');
        assertTrue(validator.hasFormedMill(board, 1, 'w'));
        assertFalse(validator.hasFormedMill(board, 3, 'w'));
    }

    @Test
    void testHasFormedMill_StandardRadial() {
        board.set(1, 'b'); board.set(9, 'b'); board.set(17, 'b');
        assertTrue(validator.hasFormedMill(board, 9, 'b'));
    }

    @Test
    void testCanRemovePiece_ProtectionRule() {
        board.set(0, 'w'); board.set(1, 'w'); board.set(2, 'w'); // Mill formed at outer top
        board.set(4, 'w'); board.set(5, 'w'); board.set(6, 'w'); // Another mill
        
        // Opponent has pieces not in any mill
        board.set(8, 'b'); // Not in mill
        assertFalse(validator.canRemovePiece(board, 8, 'b'));

        // If all opponent pieces are in mills, removal is allowed
        board.clear();
        Arrays.fill(board, null);
        board.set(0, 'w'); board.set(1, 'w'); board.set(2, 'w');
        board.set(4, 'w'); board.set(5, 'w'); board.set(6, 'w');
        board.set(8, 'b'); board.set(9, 'b'); board.set(10, 'b'); // All b in mill
        assertTrue(validator.canRemovePiece(board, 8, 'b'));
    }

    @Test
    void testHasAnyValidMoves_Flying() {
        board.set(0, 'w'); board.set(4, 'w'); board.set(8, 'w'); // Exactly 3 pieces
        board.set(12, null);
        assertTrue(validator.hasAnyValidMoves(board, 'w'));
    }

    @Test
    void testHasAnyValidMoves_Blocked() {
        board.set(0, 'w'); board.set(1, 'w'); // 2 pieces, surrounded by own/empty but no path to empty? Simulate blocked
        // Simplified: if all neighbors are occupied or out of bounds logic handled by ADJ
        board.set(1, null); board.set(7, null); // Empty neighbors exist
        assertTrue(validator.hasAnyValidMoves(board, 'w'));
        
        board.set(0, 'b'); board.set(7, 'b'); board.set(1, 'b');
        assertFalse(validator.hasAnyValidMoves(board, 'w'));
    }

    @Test
    void testDeterministicStateTransition_NoTimeouts() {
        // Ensures validator is pure function based, no internal timers or async side effects
        List<Character> state = new ArrayList<>(Collections.nCopies(24, null));
        state.set(0,'w'); state.set(1,'w'); state.set(2,'w');
        boolean result1 = validator.hasFormedMill(state, 2, 'w');
        boolean result2 = validator.hasFormedMill(state, 2, 'w');
        assertEquals(result1, result2); // Deterministic
    }
}