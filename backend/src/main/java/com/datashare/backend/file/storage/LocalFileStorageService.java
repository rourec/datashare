package com.datashare.backend.file.storage;

import com.datashare.backend.common.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalFileStorageService {

    private final Path uploadDirectory;

    public LocalFileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
        initializeUploadDirectory();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Cannot store an empty file.");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "" : file.getOriginalFilename()
        );

        if (originalFilename.isBlank() || originalFilename.contains("..")) {
            throw new FileStorageException("Invalid file name: " + originalFilename);
        }

        String storedFilename = UUID.randomUUID() + extractExtension(originalFilename);
        Path targetPath = resolve(storedFilename);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath);
            return storedFilename;
        } catch (FileAlreadyExistsException exception) {
            throw new FileStorageException("Generated file name already exists.", exception);
        } catch (IOException exception) {
            throw new FileStorageException("Failed to store file: " + originalFilename, exception);
        }
    }

    public Resource loadAsResource(String storedFilename) {

        Path path = resolve(storedFilename);

        Resource resource = new PathResource(path);

        if (!resource.exists() || !resource.isReadable()) {
            throw new FileStorageException("File not found: " + storedFilename);
        }

        return resource;
    }

    public boolean exists(String storedFilename) {
        return Files.exists(resolve(storedFilename));
    }

    public void delete(String storedFilename) {
        try {
            Files.deleteIfExists(resolve(storedFilename));
        } catch (IOException exception) {
            throw new FileStorageException("Failed to delete file: " + storedFilename, exception);
        }
    }

    private void initializeUploadDirectory() {
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException exception) {
            throw new FileStorageException("Could not initialize upload directory: " + uploadDirectory, exception);
        }
    }

    private Path resolve(String storedFilename) {

        Path resolvedPath = uploadDirectory.resolve(storedFilename).normalize();

        if (!resolvedPath.startsWith(uploadDirectory)) {
            throw new FileStorageException("Invalid storage path: " + storedFilename);
        }

        return resolvedPath;
    }

    private static String extractExtension(String filename) {

        int extensionIndex = filename.lastIndexOf('.');

        if (extensionIndex >= 0 && extensionIndex < filename.length() - 1) {
            return filename.substring(extensionIndex);
        }

        return "";
    }
}
