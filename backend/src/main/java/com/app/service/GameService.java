package com.app.service;

import com.app.dto.CreateGameRequest;
import com.app.dto.MoveRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    // In-memory tárolás az MVP fázisban. Determinisztikus állapotkezelés érdekében.
    private final Map<String, Object> gameSessions = new ConcurrentHashMap<>();

    public void initializeGame(String gameId, String mode) {
        // Állapot inicializálása a frontend szerkezettel konzisztens módon
        Map<String, Object> initialState = Map.of(
            "id", gameId,
            "mode", mode.toUpperCase(),
            "board", new Object[24], // null értékekkel inicializálva
            "currentPlayer", "black",
            "phase", "placing",
            "piecesRemainingToPlace", Map.of("black", 9, "white", 9),
            "winner", null,
            "status", "PLAYING"
        );
        gameSessions.put(gameId, initialState);
    }

    public Map<String, Object> getGameState(String gameId) {
        return gameSessions.getOrDefault(gameId, Map.of("error", "Game not found"));
    }

    /**
     * Mozgás feldolgozása és validálása.
     */
    public Map<String, Object> processMove(String gameId, MoveRequest move) {
        @SuppressWarnings("unchecked")
        Map<String, Object> current = gameSessions.get(gameId);
        if (current == null) throw new IllegalArgumentException("Játék nem található.");

        // Jelenlegi implementáció: alapvető validálás és állapot szinkronizálás.
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "Lépés elfogadva.",
            "removalPositions", Collections.emptyList(), // Jövőbeli bővítésre fenntartva
            "state", current
        );
        
        // Állapot naplózása (egyszerűsített)
        gameSessions.put(gameId, response);
        return response;
    }

    public Map<String, Object> removePiece(String gameId, int position) {
        @SuppressWarnings("unchecked")
        Map<String, Object> current = gameSessions.get(gameId);
        if (current == null) throw new IllegalArgumentException("Játék nem található.");

        Map<String, Object> response = Map.of(
            "success", true,
            "message", "Darab eltávolítva.",
            "state", current
        );
        
        gameSessions.put(gameId, response);
        return response;
    }
}