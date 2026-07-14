package com.datashare.backend.file.validation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Component
public class FileValidator {

    @Value("${app.file.max-size}")
    private long maxFileSize;

    @Value("#{'${app.file.allowed-types}'.split(',')}")
    private List<String> allowedContentTypes;

    public void validate(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
        }

        String contentType = file.getContentType() == null
                ? "application/octet-stream"
                : file.getContentType();

        if (!allowedContentTypes.contains("*")
                && !allowedContentTypes.contains(contentType)) {
            throw new IllegalArgumentException("File type is not allowed");
        }
    }
}
