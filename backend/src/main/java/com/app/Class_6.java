package com.malmo.controller;

import com.malmo.engine.NineMensMorrisEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/game")
public class GameController {
    private final Map<String, NineMensMorrisEngine> activeGames = new HashMap<>();

    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createGame() {
        String gameId = UUID.randomUUID().toString();
        activeGames.put(gameId, new NineMensMorrisEngine(NineMensMorrisEngine.Player.BLACK));
        return ResponseEntity.ok(Map.of("gameId", gameId));
    }

    @GetMapping("/state/{gameId}")
    public ResponseEntity<Map<String, Object>> getState(@PathVariable String gameId) {
        NineMensMorrisEngine engine = activeGames.get(gameId);
        if (engine == null) return ResponseEntity.badRequest().body(Map.of("error", "Game not found"));
        
        Map<String, Object> state = new HashMap<>();
        state.put("board", Arrays.toString(engine.getBoard()));
        state.put("currentPlayer", engine.getCurrentPlayer().name());
        state.put("phase", engine.getPhase().name());
        return ResponseEntity.ok(state);
    }

    @PostMapping("/move/{gameId}")
    public ResponseEntity<Map<String, Object>> executeMove(
            @PathVariable String gameId, 
            @RequestParam String action, 
            @RequestParam(required = false) Integer from, 
            @RequestParam(required = false) Integer to) {
        
        NineMensMorrisEngine engine = activeGames.get(gameId);
        if (engine == null) return ResponseEntity.badRequest().body(Map.of("error", "Game not found"));

        NineMensMorrisEngine.Player player = engine.getCurrentPlayer();
        boolean success = false;

        try {
            switch (action.toUpperCase()) {
                case "PLACE" -> success = engine.placePiece(to, player);
                case "MOVE" -> success = engine.movePiece(from, to, player);
                case "REMOVE" -> success = engine.removePiece(to, player);
                default -> throw new IllegalArgumentException("Invalid action");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Illegal move blocked by deterministic validation."));
        }

        if (success) {
            Map<String, Object> state = new HashMap<>();
            state.put("board", Arrays.toString(engine.getBoard()));
            state.put("currentPlayer", engine.getCurrentPlayer().name());
            state.put("phase", engine.getPhase().name());
            return ResponseEntity.ok(state);
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Move rejected."));
    }
}