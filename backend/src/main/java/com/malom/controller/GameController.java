package com.malom.controller;

import com.malom.service.MatchEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final MatchEngine engine;

    public GameController(MatchEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reset() {
        return ResponseEntity.ok(engine.createSession());
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<?> move(@PathVariable String id, 
                                  @RequestBody MatchEngine.MoveRequest req) throws Exception {
        try {
            var state = engine.applyMove(id, req);
            return ResponseEntity.ok(state);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/state")
    public ResponseEntity<?> getState(@PathVariable String id) {
        return ResponseEntity.ok(engine.getState(id));
    }
}