package com.datashare.backend.file;

import java.time.LocalDateTime;
import java.util.UUID;

public record FileHistoryResponse(
        UUID uuidFile,
        String originalFilename,
        Long size,
        String contentType,
        String downloadUrl,
        FileStatus status,
        LocalDateTime uploadedAt,
        LocalDateTime expiresAt
) {
}
