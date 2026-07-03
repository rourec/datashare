package com.datashare.backend.file;

import com.datashare.backend.common.exception.FileStorageException;
import com.datashare.backend.file.storage.LocalFileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.*;

class LocalFileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void store_shouldSaveFileAndReturnGeneratedFilename() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                "text/plain",
                "Hello DataShare".getBytes()
        );

        String storedFilename = service.store(file);

        assertThat(storedFilename).endsWith(".txt");
        assertThat(service.exists(storedFilename)).isTrue();
    }

    @Test
    void store_shouldRejectEmptyFile() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(FileStorageException.class)
                .hasMessage("Cannot store an empty file.");
    }

    @Test
    void loadAsResource_shouldReturnReadableResource() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                "text/plain",
                "Hello DataShare".getBytes()
        );

        String storedFilename = service.store(file);
        Resource resource = service.loadAsResource(storedFilename);

        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
    }

    @Test
    void delete_shouldRemoveStoredFile() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                "text/plain",
                "Hello DataShare".getBytes()
        );

        String storedFilename = service.store(file);

        service.delete(storedFilename);

        assertThat(service.exists(storedFilename)).isFalse();
    }

    @Test
    void loadAsResource_shouldRejectMissingFile() {
        LocalFileStorageService service = new LocalFileStorageService(tempDir.toString());

        assertThatThrownBy(() -> service.loadAsResource("missing.txt"))
                .isInstanceOf(FileStorageException.class)
                .hasMessage("File not found: missing.txt");
    }
}
