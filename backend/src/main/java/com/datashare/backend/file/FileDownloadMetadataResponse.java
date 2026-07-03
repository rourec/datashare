package com.datashare.backend.file;

import java.time.LocalDateTime;

public record FileDownloadMetadataResponse(
        String originalFilename,
        Long size,
        String contentType,
        LocalDateTime expiresAt
) {
}
