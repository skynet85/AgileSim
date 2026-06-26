package com.malom.controller;

import com.malom.service.GameStateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/matches/{roomId}")
public class MatchController {

    private final GameStateService gameStateService;

    public MatchController(GameStateService gameStateService) {
        this.gameStateService = gameStateService;
    }

    @PutMapping("/state")
    public ResponseEntity<?> updateGameState(
            @PathVariable String roomId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody MoveRequest request) {
        
        try {
            // Server-authoritative validation & deterministic state transition
            gameStateService.processMove(roomId, idempotencyKey, request);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            // 409 Conflict: Invalid transition or key collision handled by service layer
            return ResponseEntity.status(409).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/state")
    public ResponseEntity<?> getGameState(@PathVariable String roomId) {
        var snapshot = gameStateService.getSnapshot(roomId);
        return ResponseEntity.ok(snapshot);
    }
    
    // Request DTO placeholder for brevity
    public record MoveRequest(String action, Object payload) {}
}