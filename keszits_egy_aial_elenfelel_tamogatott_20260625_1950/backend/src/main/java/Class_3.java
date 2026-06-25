package com.morris.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SubmitMoveRequest(
    @NotNull(message = "from_index kötelező") 
    @Min(value = 0, message = "from_index minimum 0")
    @Max(value = 23, message = "from_index maximum 23")
    int fromIndex,

    @NotNull(message = "to_index kötelező") 
    @Min(value = 0, message = "to_index minimum 0")
    @Max(value = 23, message = "to_index maximum 23")
    int toIndex
) {}