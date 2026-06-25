package com.morris.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateGameRequest(
    @NotNull(message = "player_id kötelező") UUID playerId,
    @NotNull(message = "difficulty_tier kötelező") DifficultyTier difficultyTier
) {
    public enum DifficultyTier { EASY, MEDIUM, HARD, ADAPTIVE }
}