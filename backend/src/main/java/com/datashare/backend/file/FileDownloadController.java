package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/download")
@RequiredArgsConstructor
public class FileDownloadController {

    private final FileTransferService fileTransferService;

    @GetMapping("/{token}/metadata")
    public FileDownloadMetadataResponse metadata(@PathVariable String token) {
        return fileTransferService.getDownloadMetadata(token);
    }

    @GetMapping("/{token}")
    public ResponseEntity<Resource> download(@PathVariable String token) {
        Resource resource = fileTransferService.download(token);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\""
                )
                .body(resource);
    }
}
