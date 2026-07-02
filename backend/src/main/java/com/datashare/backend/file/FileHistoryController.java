package com.datashare.backend.file;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileHistoryController {

    private final FileTransferService fileTransferService;

    @GetMapping("/history")
    public List<FileHistoryResponse> history(Authentication authentication) {
        return fileTransferService.history(authentication.getName());
    }
}
