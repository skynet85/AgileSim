package com.app.dto;

import java.util.List;

public record GameResponse(String gameId, List<String> board, int currentPlayer, String phase, String status) {}