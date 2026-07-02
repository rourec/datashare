package com.datashare.backend.file.storage;

import com.datashare.backend.common.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileStorageService {

    private final Path uploadDirectory;

    public LocalFileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException exception) {
            throw new FileStorageException("Could not initialize upload directory: " + this.uploadDirectory, exception);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Cannot store an empty file.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());

        if (originalFilename.contains("..")) {
            throw new FileStorageException("Invalid file name detected: " + originalFilename);
        }

        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID().toString() + extension;
        Path targetLocation = this.uploadDirectory.resolve(storedFilename).normalize();

        if (!targetLocation.startsWith(this.uploadDirectory)) {
            throw new FileStorageException("Cannot store file outside the designated upload directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new FileStorageException("Failed to store file " + originalFilename, exception);
        }

        return storedFilename;
    }

    private static String extractExtension(String filename) {
        int extensionIndex = filename.lastIndexOf('.');
        if (extensionIndex >= 0 && extensionIndex < filename.length() - 1) {
            return filename.substring(extensionIndex);
        }
        return "";
    }
}

