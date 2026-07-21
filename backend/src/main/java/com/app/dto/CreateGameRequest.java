package com.app.dto;

import java.util.Set;

public record CreateGameRequest(String mode) {
    public CreateGameRequest {
        // Szigorú validáció a bemeneti adatok integritásáért
        if (mode == null || !Set.of("SINGLE", "LOCAL_MULTI").contains(mode.toUpperCase())) {
            throw new IllegalArgumentException("Érvénytelen játékmód. Csak SINGLE vagy LOCAL_MULTI engedélyezett.");
        }
    }
}