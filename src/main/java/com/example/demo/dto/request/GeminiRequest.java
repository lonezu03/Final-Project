package com.example.demo.dto.request;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GeminiRequest {
    private List<Content> contents;
    @JsonProperty("generation_config")
    private GenerationConfig generationConfig;

    // Các lớp con
    @Data
    @AllArgsConstructor
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    public static class Part {
        private String text;
    }

    @Data
    @AllArgsConstructor
    public static class GenerationConfig {
        @JsonProperty("response_modalities")
        private List<String> responseModalities;
    }
}