package com.datashare.backend.file;

import com.datashare.backend.file.storage.LocalFileStorageService;
import com.datashare.backend.file.validation.FileValidator;
import com.datashare.backend.user.User;
import com.datashare.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileTransferService {

    private final FileTransferRepository fileTransferRepository;
    private final UserRepository userRepository;
    private final LocalFileStorageService localFileStorageService;
    private final FileValidator fileValidator;

    @Value("${app.file.expiration-days}")
    private int expirationDays;

    public FileUploadResponse upload(MultipartFile file, String userEmail) {
        fileValidator.validate(file);

        User owner = getUserByEmail(userEmail);

        String storedFilename = localFileStorageService.store(file);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(expirationDays);
        String downloadToken = UUID.randomUUID().toString();

        FileTransfer fileTransfer = FileTransfer.builder()
                .originalFilename(file.getOriginalFilename())
                .storedFilename(storedFilename)
                .contentType(resolveContentType(file))
                .size(file.getSize())
                .downloadToken(downloadToken)
                .uploadedAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .storagePath(storedFilename)
                .status(FileStatus.ACTIVE)
                .owner(owner)
                .build();

        FileTransfer savedFile = fileTransferRepository.save(fileTransfer);

        return new FileUploadResponse(
                savedFile.getUuidFile(),
                savedFile.getOriginalFilename(),
                savedFile.getSize(),
                savedFile.getContentType(),
                savedFile.getDownloadToken(),
                "/api/download/" + savedFile.getDownloadToken(),
                savedFile.getExpiresAt()
        );
    }

    public Resource download(String downloadToken) {
        FileTransfer file = fileTransferRepository.findByDownloadToken(downloadToken)
                .orElseThrow(() -> new IllegalArgumentException("Download token not found"));

        if (file.getStatus() != FileStatus.ACTIVE) {
            throw new IllegalStateException("File is not available");
        }

        if (file.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Download link has expired");
        }

        return localFileStorageService.loadAsResource(file.getStoredFilename());
    }


    public void delete(UUID uuidFile, String userEmail) {
        User owner = getUserByEmail(userEmail);

        FileTransfer file = fileTransferRepository.findByUuidFileAndOwner(uuidFile, owner)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        if (file.getStatus() == FileStatus.DELETED) {
            return;
        }

        localFileStorageService.delete(file.getStoredFilename());

        file.setStatus(FileStatus.DELETED);
        file.setDeletedAt(LocalDateTime.now());

        fileTransferRepository.save(file);
    }

    public List<FileHistoryResponse> history(String userEmail) {
        User owner = getUserByEmail(userEmail);

        return fileTransferRepository.findByOwnerOrderByUploadedAtDesc(owner)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    private User getUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private FileHistoryResponse toHistoryResponse(FileTransfer file) {
        return new FileHistoryResponse(
                file.getUuidFile(),
                file.getOriginalFilename(),
                file.getSize(),
                file.getContentType(),
                "/api/download/" + file.getDownloadToken(),
                file.getStatus(),
                file.getUploadedAt(),
                file.getExpiresAt()
        );
    }

    private String resolveContentType(MultipartFile file) {
        return file.getContentType() == null
                ? "application/octet-stream"
                : file.getContentType();
    }
}
