package com.datashare.backend.file.scheduler;

import com.datashare.backend.file.FileStatus;
import com.datashare.backend.file.FileTransfer;
import com.datashare.backend.file.FileTransferRepository;
import com.datashare.backend.file.storage.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FileExpirationScheduler {

    private final FileTransferRepository fileTransferRepository;
    private final LocalFileStorageService localFileStorageService;

    @Scheduled(cron = "${app.file.expiration-cron:0 0 * * * *}")
    public void expireFiles() {
        List<FileTransfer> expiredFiles = fileTransferRepository
                .findByStatusAndExpiresAtBefore(FileStatus.ACTIVE, LocalDateTime.now());

        expiredFiles.forEach(file -> {
            localFileStorageService.delete(file.getStoredFilename());
            file.setStatus(FileStatus.EXPIRED);
            fileTransferRepository.save(file);
        });
    }
}
