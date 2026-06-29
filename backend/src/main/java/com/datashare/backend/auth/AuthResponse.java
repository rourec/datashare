package com.datashare.backend.auth;

import java.util.UUID;

public record AuthResponse(
        UUID uuidUser,
        String email
) {
}
