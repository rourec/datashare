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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileTransferServiceTest {

    @Mock
    private FileTransferRepository fileTransferRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LocalFileStorageService localFileStorageService;

    @Mock
    private FileValidator fileValidator;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private FileTransferService fileTransferService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(fileTransferService, "expirationDays", 7);
    }

    @Test
    void upload_shouldStoreFileAndPersistMetadata() {
        User user = User.builder()
                .uuidUser(UUID.randomUUID())
                .email("test@datashare.com")
                .passwordHash("hash")
                .build();

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
}
