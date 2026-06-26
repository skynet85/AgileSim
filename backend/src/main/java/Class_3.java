package com.malom.game.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.malom.game.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
public class MatchController {

    private final GameService gameService;
    private final ObjectMapper jacksonMapper = new ObjectMapper(); // Consistent serialization across layers

    public MatchController(GameService gameService) {
        this.gameService = gameService;
    }

    @MessageMapping("/match/move")
    @SendTo("/topic/game-state")
    public Map<String, Object> handleMove(Map<String, Object> payload) throws JsonProcessingException {
        String matchId = (String) payload.get("room_id");
        GameService.MoveAttempt attempt = jacksonMapper.convertValue(payload.get("payload"), GameService.MoveAttempt.class);
        
        // Enforce clientSeqId for RTT latency tracking & seq monotonicity validation
        if (attempt.clientSeqId <= 0) return Map.of("event", "ERROR_RECOVERY", "message", "SEQ_ID_MANDATORY");

        return gameService.processMove(matchId, attempt);
    }
}