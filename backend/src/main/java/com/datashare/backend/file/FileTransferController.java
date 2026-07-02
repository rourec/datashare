package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
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
            Authentication authentication
    ) {
        return fileTransferService.upload(file, authentication.getName());
    }
}
