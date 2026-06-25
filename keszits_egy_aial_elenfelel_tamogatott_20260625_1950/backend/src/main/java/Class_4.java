package com.morris.dto;

public record SubmitMoveResponse(
    String status,
    String boardSnapshot,
    boolean aiDecisionPending
) {}