package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
import com.datashare.backend.file.dto.FileUploadRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileTransferController {

    private final FileTransferService fileTransferService;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public FileUploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute FileUploadRequest request,
            Authentication authentication
    ) {
        return fileTransferService.upload(file, authentication.getName(), request.getExpirationDays());
    }
}
