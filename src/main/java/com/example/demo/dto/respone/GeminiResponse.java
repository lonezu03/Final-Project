package com.example.demo.dto.respone;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiResponse {
    private List<Candidate> candidates;

    // Các lớp con
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Candidate {
        private Content content;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part {
        private String text;
        @JsonProperty("inlineData")
        private InlineData inlineData;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InlineData {
        @JsonProperty("mime_type")
        private String mimeType;
        private String data;
    }
}