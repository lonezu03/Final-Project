package com.example.demo.dto.respone;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageResponseDto {
    private String textResponse;
    private String base64Image;
}