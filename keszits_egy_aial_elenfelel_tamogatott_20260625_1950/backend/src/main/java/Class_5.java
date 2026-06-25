package com.morris.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "games")
public class GameEntity {
    @Id
    private UUID gameId;

    @Column(nullable = false)
    private UUID playerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_difficulty_tier", nullable = false)
    private DifficultyTier aiDifficultyTier;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", nullable = false)
    private GamePhase currentPhase;

    @Enumerated(EnumType.STRING)
    @Column(name = "turn_player", nullable = false)
    private TurnPlayer turnPlayer;

    @Lob
    @Column(name = "board_snapshot", columnDefinition = "jsonb", nullable = false)
    private String boardSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum DifficultyTier { EASY, MEDIUM, HARD, ADAPTIVE }
    public enum GamePhase { PLACING, MOVING, ELIMINATING }
    public enum TurnPlayer { PLAYER, AI }
    public enum GameStatus { ACTIVE, FINISHED, PAUSED }

    // Getters & Setters omitted for brevity. In production, use Lombok @Data or explicit methods.
}