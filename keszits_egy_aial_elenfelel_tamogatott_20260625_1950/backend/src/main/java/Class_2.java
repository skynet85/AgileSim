package com.morris.dto;

import java.util.UUID;

public record CreateGameResponse(
    UUID gameId,
    String boardState,
    DifficultyTier aiDifficulty
) {
    public enum DifficultyTier { EASY, MEDIUM, HARD, ADAPTIVE }
}