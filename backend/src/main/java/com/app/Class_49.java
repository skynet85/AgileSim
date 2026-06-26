package com.malom.controller;

import com.malom.service.MatchEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {
    private final MatchEngine engine;

    @PostMapping("/reset")
    public ResponseEntity<MatchEngine.State> reset() {
        return ResponseEntity.ok(new MatchEngine.State());
    }

    @PostMapping("/move")
    public ResponseEntity<MatchEngine.State> move(@RequestBody MoveRequest req) {
        try {
            // In production, state would be persisted/session-based. 
            // Here we simulate a fresh state for demonstration of the engine logic.
            MatchEngine.State initialState = new MatchEngine.State();
            MatchEngine.State result = engine.applyMove(initialState, req.from(), req.to());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    public record MoveRequest(int from, int to) {}
}