package com.morris.controller;

import com.morris.dto.*;
import com.morris.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/games")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<CreateGameResponse> createGame(@Valid @RequestBody CreateGameRequest request) {
        CreateGameResponse response = gameService.createGame(request);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<String> getGameState(@PathVariable UUID gameId) {
        String state = gameService.getGameState(gameId);
        return ResponseEntity.ok(state);
    }

    @PostMapping("/{gameId}/moves")
    public ResponseEntity<SubmitMoveResponse> submitMove(
            @PathVariable UUID gameId, 
            @Valid @RequestBody SubmitMoveRequest moveReq) {
        
        SubmitMoveResponse response = gameService.submitMove(gameId, moveReq);
        
        if ("REJECTED".equals(response.status())) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}