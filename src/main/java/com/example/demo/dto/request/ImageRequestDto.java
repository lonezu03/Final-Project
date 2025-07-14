package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImageRequestDto {
    @NotBlank(message = "Prompt không được để trống")
    private String prompt;
}