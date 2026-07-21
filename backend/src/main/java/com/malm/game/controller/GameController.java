package com.malm.game.controller;

import com.malm.game.model.GameStatus;
import com.malm.game.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public ResponseEntity<GameStatus> getStatus() {
        return ResponseEntity.ok(gameService.getStatus());
    }

    @PostMapping("/move")
    public ResponseEntity<?> applyMove(@RequestBody MoveRequest request) {
        try {
            Integer from = (request.getFrom() != null) ? request.getFrom() : null;
            Integer to = request.getTo();
            
            if (from == null && to != null) {
                return ResponseEntity.ok(gameService.applyRemoval(to));
            }
            return ResponseEntity.ok(gameService.applyMove(from, to));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<GameStatus> reset() {
        gameService.reset();
        return ResponseEntity.ok(gameService.getStatus());
    }
    
    static class MoveRequest {
        private Integer from;
        private Integer to;
        public Integer getFrom() { return from; }
        public void setFrom(Integer from) { this.from = from; }
        public Integer getTo() { return to; }
        public void setTo(Integer to) { this.to = to; }
    }
}