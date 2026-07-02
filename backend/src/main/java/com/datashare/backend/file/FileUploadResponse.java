package com.datashare.backend.file;

import java.time.LocalDateTime;
import java.util.UUID;

public record FileUploadResponse(
        UUID uuidFile,
        String originalFilename,
        Long size,
        String contentType,
        String downloadToken,
        String downloadUrl,
        LocalDateTime expiresAt
) {
}
