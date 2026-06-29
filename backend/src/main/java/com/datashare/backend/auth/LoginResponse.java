package com.datashare.backend.auth;

public record LoginResponse(
        String token,
        String tokenType
) {
}
