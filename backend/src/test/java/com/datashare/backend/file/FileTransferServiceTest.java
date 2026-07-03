package com.datashare.backend.file;

import com.datashare.backend.file.storage.LocalFileStorageService;
import com.datashare.backend.file.validation.FileValidator;
import com.datashare.backend.user.User;
import com.datashare.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileTransferServiceTest {

    @Mock private FileTransferRepository fileTransferRepository;
    @Mock private UserRepository userRepository;
    @Mock private LocalFileStorageService localFileStorageService;
    @Mock private FileValidator fileValidator;
    @Mock private MultipartFile multipartFile;
    @Mock private Resource resource;

    @InjectMocks
    private FileTransferService fileTransferService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(fileTransferService, "expirationDays", 7);
    }

    @Test
    void upload_shouldStoreFileAndPersistMetadata() {
        User user = buildUser();

        when(userRepository.findByEmail("test@datashare.com")).thenReturn(Optional.of(user));
        when(localFileStorageService.store(multipartFile)).thenReturn("stored-file.txt");
        when(multipartFile.getOriginalFilename()).thenReturn("document.txt");
        when(multipartFile.getContentType()).thenReturn("text/plain");
        when(multipartFile.getSize()).thenReturn(123L);

        when(fileTransferRepository.save(any(FileTransfer.class))).thenAnswer(invocation -> {
            FileTransfer file = invocation.getArgument(0);
            file.setUuidFile(UUID.randomUUID());
            return file;
        });

        FileUploadResponse response = fileTransferService.upload(multipartFile, "test@datashare.com");

        assertThat(response.originalFilename()).isEqualTo("document.txt");
        assertThat(response.size()).isEqualTo(123L);
        assertThat(response.downloadToken()).isNotBlank();

        verify(fileValidator).validate(multipartFile);
        verify(localFileStorageService).store(multipartFile);
        verify(fileTransferRepository).save(any(FileTransfer.class));
    }

    @Test
    void download_shouldReturnResource_whenTokenIsValid() {
        FileTransfer file = buildActiveFile();

        when(fileTransferRepository.findByDownloadToken("token-123")).thenReturn(Optional.of(file));
        when(localFileStorageService.loadAsResource("stored-file.txt")).thenReturn(resource);

        Resource result = fileTransferService.download("token-123");

        assertThat(result).isEqualTo(resource);
        verify(localFileStorageService).loadAsResource("stored-file.txt");
    }

    @Test
    void history_shouldReturnUserFiles() {
        User user = buildUser();
        FileTransfer file = buildActiveFile();

        when(userRepository.findByEmail("test@datashare.com")).thenReturn(Optional.of(user));
        when(fileTransferRepository.findByOwnerOrderByUploadedAtDesc(user)).thenReturn(List.of(file));

        List<FileHistoryResponse> history = fileTransferService.history("test@datashare.com");

        assertThat(history).hasSize(1);
        assertThat(history.get(0).originalFilename()).isEqualTo("document.txt");
        assertThat(history.get(0).status()).isEqualTo(FileStatus.ACTIVE);
    }

    @Test
    void delete_shouldMarkFileAsDeletedAndRemoveStoredFile() {
        User user = buildUser();
        FileTransfer file = buildActiveFile();
        UUID uuidFile = file.getUuidFile();

        when(userRepository.findByEmail("test@datashare.com")).thenReturn(Optional.of(user));
        when(fileTransferRepository.findByUuidFileAndOwner(uuidFile, user)).thenReturn(Optional.of(file));

        fileTransferService.delete(uuidFile, "test@datashare.com");

        verify(localFileStorageService).delete("stored-file.txt");
        verify(fileTransferRepository).delete(file);
    }

    private User buildUser() {
        return User.builder()
                .uuidUser(UUID.randomUUID())
                .email("test@datashare.com")
                .passwordHash("hash")
                .build();
    }

    private FileTransfer buildActiveFile() {
        return FileTransfer.builder()
                .uuidFile(UUID.randomUUID())
                .originalFilename("document.txt")
                .storedFilename("stored-file.txt")
                .contentType("text/plain")
                .size(123L)
                .downloadToken("token-123")
                .uploadedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .storagePath("stored-file.txt")
                .status(FileStatus.ACTIVE)
                .owner(buildUser())
                .build();
    }
}
