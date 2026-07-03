package com.datashare.backend.file.scheduler;

import com.datashare.backend.file.FileStatus;
import com.datashare.backend.file.FileTransfer;
import com.datashare.backend.file.FileTransferRepository;
import com.datashare.backend.file.storage.LocalFileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileExpirationSchedulerTest {

    @Mock
    private FileTransferRepository fileTransferRepository;

    @Mock
    private LocalFileStorageService localFileStorageService;

    @InjectMocks
    private FileExpirationScheduler fileExpirationScheduler;

    @Test
    void expireFiles_shouldDeleteStoredFilesAndMarkThemAsExpired() {
        FileTransfer expiredFile = FileTransfer.builder()
                .uuidFile(UUID.randomUUID())
                .originalFilename("document.txt")
                .storedFilename("stored-file.txt")
                .contentType("text/plain")
                .size(123L)
                .downloadToken("token-123")
                .uploadedAt(LocalDateTime.now().minusDays(10))
                .expiresAt(LocalDateTime.now().minusDays(1))
                .storagePath("stored-file.txt")
                .status(FileStatus.ACTIVE)
                .build();

        when(fileTransferRepository.findByStatusAndExpiresAtBefore(eq(FileStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredFile));

        fileExpirationScheduler.expireFiles();

        assertThat(expiredFile.getStatus()).isEqualTo(FileStatus.EXPIRED);

        verify(localFileStorageService).delete("stored-file.txt");
        verify(fileTransferRepository).save(expiredFile);
    }
}
