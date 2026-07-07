package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

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
        FileDownloadMetadataResponse metadata = fileTransferService.getDownloadMetadata(token);
        Resource resource = fileTransferService.download(token);

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(metadata.originalFilename(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }
}
