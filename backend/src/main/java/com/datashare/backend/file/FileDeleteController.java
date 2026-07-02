package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileDeleteController {

    private final FileTransferService fileTransferService;

    @DeleteMapping("/{uuidFile}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID uuidFile,
            Authentication authentication
    ) {
        fileTransferService.delete(uuidFile, authentication.getName());
    }
}
