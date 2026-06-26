package com.morris.service;

import com.morris.dto.*;
import com.morris.entity.GameEntity;
import com.morris.repository.GameRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.Optional;

@Service
public class GameService {
    private static final String KAFKA_TOPIC_GAME_STATE = "game.state";
    private static final String KAFKA_TOPIC_PLAYER_MOVE = "player.move";

    private final GameRepository gameRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MoveValidator moveValidator;
    private final AiMotorClient aiMotorClient; // Mock/Interface a PO specifikáció szerint

    public GameService(GameRepository gameRepository, 
                       KafkaTemplate<String, Object> kafkaTemplate,
                       MoveValidator moveValidator,
                       AiMotorClient aiMotorClient) {
        this.gameRepository = gameRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.moveValidator = moveValidator;
        this.aiMotorClient = aiMotorClient;
    }

    @Transactional
    public CreateGameResponse createGame(CreateGameRequest request) {
        UUID gameId = UUID.randomUUID();
        GameEntity game = new GameEntity();
        game.setGameId(gameId);
        game.setPlayerId(request.playerId());
        game.setAiDifficultyTier(request.difficultyTier());
        game.setCurrentPhase(GameEntity.GamePhase.PLACING);
        game.setTurnPlayer(GameEntity.TurnPlayer.PLAYER);
        game.setBoardSnapshot("[]"); // Initial empty board
        game.setStatus(GameEntity.GameStatus.ACTIVE);
        
        GameEntity saved = gameRepository.save(game);
        
        // State event publish
        publishGameStateEvent(saved, "GAME_CREATED", null);
        
        return new CreateGameResponse(
            gameId, 
            saved.getBoardSnapshot(), 
            request.difficultyTier()
        );
    }

    @Transactional(readOnly = true)
    public String getGameState(UUID gameId) {
        GameEntity game = gameRepository.findById(gameId)
            .orElseThrow(() -> new IllegalArgumentException("Játék nem található: " + gameId));
        return game.getBoardSnapshot();
    }

    @Transactional
    public SubmitMoveResponse submitMove(UUID gameId, SubmitMoveRequest moveReq) {
        GameEntity game = gameRepository.findById(gameId)
            .orElseThrow(() -> new IllegalArgumentException("Játék nem található: " + gameId));

        // Determinisztikus validálás
        boolean isValid = moveValidator.validateMove(game, moveReq.fromIndex(), moveReq.toIndex());
        
        if (!isValid) {
            publishPlayerMoveEvent(gameId, moveReq, "INVALID");
            return new SubmitMoveResponse("REJECTED", game.getBoardSnapshot(), false);
        }

        // Állapot frissítése (szimulált board update a specifikáció szerint)
        String updatedBoard = simulateBoardUpdate(game.getBoardSnapshot(), moveReq.fromIndex(), moveReq.toIndex());
        game.setBoardSnapshot(updatedBoard);
        
        // Phase transition logic would go here per BA spec
        // game.setCurrentPhase(...); 
        
        gameRepository.saveAndFlush(game); // Flush azonnal a determinisztikus állapotgaranciáért
        
        publishGameStateEvent(game, "STATE_UPDATE", null);
        publishPlayerMoveEvent(gameId, moveReq, "VALID");

        // AI döntési trigger (szinkron hívás a <200ms SLA miatt)
        boolean aiPending = true;
        try {
            var aiResponse = aiMotorClient.requestDecision(updatedBoard, game.getAiDifficultyTier());
            if (aiResponse != null && "VALID".equals(aiResponse.status())) {
                // Aszinkron state update a Kafka consumer felé
            }
        } catch (Exception e) {
            aiPending = false; // SLA vagy hiba esetén nem blokkoljuk a játékot, de jelezzük
        }

        return new SubmitMoveResponse("APPLIED", updatedBoard, aiPending);
    }

    private void publishGameStateEvent(GameEntity game, String eventType, Object meta) {
        kafkaTemplate.send(KAFKA_TOPIC_GAME_STATE, game.getGameId().toString(), 
            buildKafkaMessage(eventType, game));
    }

    private void publishPlayerMoveEvent(UUID gameId, SubmitMoveRequest req, String status) {
        kafkaTemplate.send(KAFKA_TOPIC_PLAYER_MOVE, gameId.toString(), 
            buildKafkaMessage("MOVE_SUBMITTED", null).withPayload(req, status));
    }

    // Helper methods omitted for brevity. Implement board manipulation and Kafka message builders deterministically.
}