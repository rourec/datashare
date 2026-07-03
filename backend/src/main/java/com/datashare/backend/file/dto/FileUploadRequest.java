package com.datashare.backend.file.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileUploadRequest {

    @Min(1)
    @Max(7)
    private Integer expirationDays = 7;
}
