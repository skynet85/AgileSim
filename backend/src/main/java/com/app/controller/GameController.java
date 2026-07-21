package com.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController 
@RequestMapping("/api/game")
public class GameController {
    private final com.app.service.GameService gameService;

    @Autowired 
    public GameController(com.app.service.GameService gameService) { 
        this.gameService = gameService; 
    }

    @PostMapping("/init") 
    public ResponseEntity<com.app.dto.GameResponse> initGame() { 
        String gameId = gameService.createGame(); 
        var board = gameService.getBoard(gameId); 
        return ResponseEntity.ok(new com.app.dto.GameResponse(gameId, board, 1, "PLACING", "Új játék inicializálva. Válassz játékost.")); 
    }

    @PostMapping("/{gameId}/move") 
    public ResponseEntity<com.app.dto.GameResponse> makeMove(
            @PathVariable String gameId, 
            @RequestBody com.app.dto.MoveRequest request) { 
        try { 
            var response = gameService.makeMove(gameId, request.fromIndex(), request.toIndex()); 
            return ResponseEntity.ok(response); 
        } catch (Exception e) { 
            return ResponseEntity.badRequest().body(
                new com.app.dto.GameResponse(gameId, java.util.List.of(new String[24]), 1, "ERROR", "Hiba: " + e.getMessage())
            ); 
        } 
    }

    @PostMapping("/{gameId}/capture") 
    public ResponseEntity<String> capturePiece(@PathVariable String gameId, @RequestBody com.app.dto.CaptureRequest request) { 
        try { 
            gameService.capturePiece(gameId, request.pieceIndex()); 
            return ResponseEntity.ok("Kikapás rögzítve."); 
        } catch (Exception e) { 
            return ResponseEntity.badRequest().body("Érvénytelen kikapási kísérlet: " + e.getMessage()); 
        } 
    }
}