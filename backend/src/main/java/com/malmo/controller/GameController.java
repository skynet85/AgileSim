package com.malmo.controller;

import com.malmo.repository.GameSessionRepository;
import com.malmo.entity.GameSessionEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameSessionRepository repository;

    public GameController(GameSessionRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/create")
    public ResponseEntity<String> createGame() {
        String id = UUID.randomUUID().toString();
        repository.save(new GameSessionEntity(id, "{}"));
        return ResponseEntity.ok(id);
    }

    @GetMapping("/state/{id}")
    public ResponseEntity<GameSessionEntity> getState(@PathVariable String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}