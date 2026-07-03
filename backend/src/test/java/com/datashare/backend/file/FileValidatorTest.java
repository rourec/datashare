package com.datashare.backend.file;

import com.datashare.backend.file.validation.FileValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class FileValidatorTest {

    private FileValidator fileValidator;

    @BeforeEach
    void setup() {
        fileValidator = new FileValidator();
        ReflectionTestUtils.setField(fileValidator, "maxFileSize", 1024L);
        ReflectionTestUtils.setField(fileValidator, "allowedContentTypes", List.of("text/plain", "application/pdf"));
    }

    @Test
    void validate_shouldAcceptValidFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "hello".getBytes()
        );

        assertThatCode(() -> fileValidator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    void validate_shouldRejectEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        assertThatThrownBy(() -> fileValidator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File is required");
    }

    @Test
    void validate_shouldRejectOversizedFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "big.txt",
                "text/plain",
                new byte[2048]
        );

        assertThatThrownBy(() -> fileValidator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File size exceeds maximum allowed size");
    }

    @Test
    void validate_shouldRejectForbiddenContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "script.exe",
                "application/x-msdownload",
                "bad".getBytes()
        );

        assertThatThrownBy(() -> fileValidator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File type is not allowed");
    }
}
