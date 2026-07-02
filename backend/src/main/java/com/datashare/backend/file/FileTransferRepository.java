package com.datashare.backend.file;

import com.datashare.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileTransferRepository extends JpaRepository<FileTransfer, UUID> {

    Optional<FileTransfer> findByDownloadToken(String downloadToken);

    List<FileTransfer> findByOwnerOrderByUploadedAtDesc(User owner);

    List<FileTransfer> findByStatus(FileStatus status);

    List<FileTransfer> findByStatusAndExpiresAtBefore(FileStatus status,
                                                      LocalDateTime dateTime);

    boolean existsByDownloadToken(String downloadToken);
}
