package com.malmo.engine;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class NineMensMorrisEngineTest {

    private final NineMensMorrisEngine engine = new NineMensMorrisEngine();

    @Test
    void testValidAdjacency() {
        // Point 0 connects to 1 and 7 (Outer ring) and 8 (Cross)
        assertTrue(engine.isValidMove("{}", 0, 1, "P1"));
        assertTrue(engine.isValidMove("{}", 0, 7, "P1"));
        assertTrue(engine.isValidMove("{}", 0, 8, "P1"));
        
        // Point 0 should NOT connect to 2 (Diagonal/Non-adjacent)
        assertFalse(engine.isValidMove("{}", 0, 2, "P1"));
    }

    @Test
    void testMillDetection() {
        assertTrue(engine.detectsMill(0, "P1")); // Part of outer ring mill
    }
}