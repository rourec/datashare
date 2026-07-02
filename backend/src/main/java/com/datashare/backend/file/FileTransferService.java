package com.datashare.backend.file;

import com.datashare.backend.file.storage.LocalFileStorageService;
import com.datashare.backend.user.User;
import com.datashare.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileTransferService {

    private static final int DEFAULT_EXPIRATION_DAYS = 7;

    private final FileTransferRepository fileTransferRepository;
    private final UserRepository userRepository;
    private final LocalFileStorageService localFileStorageService;

    public FileUploadResponse upload(MultipartFile file, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        String storedFilename = localFileStorageService.store(file);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(DEFAULT_EXPIRATION_DAYS);
        String downloadToken = UUID.randomUUID().toString();

        FileTransfer fileTransfer = FileTransfer.builder()
                .originalFilename(file.getOriginalFilename())
                .storedFilename(storedFilename)
                .contentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
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
}
