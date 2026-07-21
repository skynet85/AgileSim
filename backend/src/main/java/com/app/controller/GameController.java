package com.app.controller;

import com.app.dto.CreateGameRequest;
import com.app.dto.MoveRequest;
import com.app.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createGame(@RequestBody CreateGameRequest request) {
        // Egyedi azonosító generálása a játék állapotának elkülönítésére
        String gameId = UUID.randomUUID().toString();
        gameService.initializeGame(gameId, request.mode());
        
        return ResponseEntity.ok(Map.of(
            "gameId", gameId,
            "status", "CREATED"
        ));
    }

    @PostMapping("/{gameId}/move")
    public ResponseEntity<Map<String, Object>> submitMove(@PathVariable String gameId, 
                                                          @RequestBody MoveRequest move) {
        try {
            Map<String, Object> result = gameService.processMove(gameId, move);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/remove")
    public ResponseEntity<Map<String, Object>> removePiece(@PathVariable String gameId, 
                                                           @RequestBody Map<String, Integer> request) {
        try {
            Map<String, Object> result = gameService.removePiece(gameId, request.get("position"));
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<Map<String, Object>> getGameState(@PathVariable String gameId) {
        Map<String, Object> state = gameService.getGameState(gameId);
        if (state == null || state.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // A frontend szerkezetének megfelelő burkolás
        return ResponseEntity.ok(Map.of("state", state));
    }
}