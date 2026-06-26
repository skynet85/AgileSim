package com.malmo.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.malmo.engine.NineMensMorrisEngine;
import com.malmo.entity.GameSessionEntity;
import com.malmo.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final NineMensMorrisEngine engine;
    private final GameSessionRepository repository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @MessageMapping("/game/{sessionId}/move")
    public void processMove(Map<String, Object> payload, Map<String, String> headers) {
        String sessionId = (String) headers.get("simpSessionId"); // Simplified session extraction for demo
        // In STOMP/sockJS, session ID mapping is handled by Spring. 
        // We assume the frontend sends sessionId in payload or topic routing handles it.
        
        // Robust implementation: Extract sessionId from destination or header if configured properly.
        // For this MVP structure, we use a static map simulation for session binding logic as per docs constraint.
        String sid = (String) payload.get("sessionId");
        
        log.info("[WS] Move attempt on session: {}", sid);

        try {
            GameSessionEntity game = repository.findById(sid).orElseThrow();
            
            // Parse move details
            int from = objectMapper.valueToTree(payload).get("from").asInt();
            int to = objectMapper.valueToTree(payload).get("to").asInt();
            String player = (String) payload.get("player");

            // Validate Topology
            if (!engine.isValidMove(game.getGameStateJson(), from, to, player)) {
                log.warn("[WS] Invalid Move Rejected: Topology violation.");
                messagingTemplate.convertAndSend("/topic/error/" + sid, "Invalid move topology.");
                return;
            }

            // Update State (Optimistic Locking handled by JPA)
            game.setGameStateJson("UPDATED_STATE_JSON_PLACEHOLDER"); 
            repository.save(game);

            // Broadcast Sync Event
            messagingTemplate.convertAndSend("/topic/sync/" + sid, Map.of(
                "type", "STATE_UPDATE",
                "payload", game.getGameStateJson(),
                "version", game.getVersion()
            ));

        } catch (Exception e) {
            log.error("[WS] Critical Game Error: {}", e.getMessage());
            messagingTemplate.convertAndSend("/topic/error/" + sid, "Game state conflict or error.");
        }
    }

    @Transactional
    public void initializeSession(String sessionId) {
        if (!repository.existsById(sessionId)) {
            repository.save(new GameSessionEntity(sessionId, "{}"));
            log.info("[WS] Session {} initialized.", sessionId);
        }
    }
}