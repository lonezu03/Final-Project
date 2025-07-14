package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.demo.dto.request.GeminiRequest;
import com.example.demo.dto.respone.GeminiResponse;
import com.example.demo.dto.respone.ImageResponseDto;
import com.example.demo.dto.respone.UploadFileRespone;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import reactor.core.scheduler.Schedulers; // <-- Thêm import
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final WebClient webClient;
    private final String apiUrl;
    private final String apiKey;
    // private final ObjectMapper objectMapper; // <-- XÓA DÒNG NÀY

    private final UploadFileService uploadFileService;

    // Sửa đổi constructor để inject UploadFileService
    public GeminiService(WebClient webClient,
                         @Value("${gemini.api.url}") String apiUrl,
                         @Value("${gemini.api.key}") String apiKey,
                         UploadFileService uploadFileService) { // <-- Thêm vào constructor
        this.webClient = webClient;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.uploadFileService = uploadFileService; // <-- Gán giá trị
    }

    public Mono<ImageResponseDto> generateImage(String prompt) {
        logger.info(">>> [START] Bắt đầu quá trình tạo ảnh với prompt: '{}'", prompt);

        GeminiRequest.Part part = new GeminiRequest.Part(prompt);
        GeminiRequest.Content content = new GeminiRequest.Content(List.of(part));
        GeminiRequest.GenerationConfig config = new GeminiRequest.GenerationConfig(List.of("TEXT", "IMAGE"));
        GeminiRequest geminiRequest = new GeminiRequest(List.of(content), config);

        logger.debug(">>> [REQUEST-BODY] Chuẩn bị gửi request tới Gemini: {}", geminiRequest);

        return webClient.post()
                .uri(apiUrl, uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(geminiRequest)
                .retrieve()
                .onStatus(status -> status.isError(),
                        response -> response.bodyToMono(String.class).flatMap(errorBody -> {
                            logger.error("!!! [API-ERROR] Gemini API trả về lỗi. Status: {}, Body: {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Gemini API Error: " + errorBody));
                        }))
                .bodyToMono(String.class)
                // SỬ DỤNG PHƯƠNG THỨC MỚI ĐỂ LOG JSON ĐÃ ĐƯỢC CẮT NGẮN
                .doOnNext(rawJson -> logger.debug("<<< [RAW-RESPONSE-BODY] Giá trị JSON thô từ Gemini: {}", truncateBase64InData(rawJson)))
                .map(rawJson -> {
                    try {
                        ObjectMapper localMapper = new ObjectMapper();
                        localMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                        return localMapper.readValue(rawJson, GeminiResponse.class);
                    } catch (JsonProcessingException e) {
                        logger.error("!!! [JSON-PARSE-ERROR] Không thể phân tích JSON từ Gemini. Lỗi: {}", e.getMessage(), e);
                        throw new RuntimeException("Failed to parse JSON response from Gemini", e);
                    }
                })
                .doOnNext(response -> logger.info("<<< [RESPONSE-SUCCESS] Phân tích JSON thành công."))
                .map(this::extractDataFromResponse);
    }
    
    /**
     * Điều phối toàn bộ quá trình: Tạo ảnh từ Gemini và upload lên Cloudinary.
     *
     * @param prompt Mô tả cho ảnh cần tạo.
     * @return Mono chứa URL của ảnh đã được upload lên Cloudinary.
     */
    public Mono<String> generateAndUploadImage(String prompt) {
        return generateImage(prompt) // Bước 1: Gọi API Gemini, trả về Mono<ImageResponseDto>
                .flatMap(imageResponseDto -> {
                    // Bước 2: Lấy chuỗi base64 từ response
                    String base64Image = imageResponseDto.getBase64Image();
                    
                    // Bước 3: Gọi service upload. Vì đây là tác vụ blocking I/O,
                    // chúng ta bọc nó trong Mono.fromCallable để Reactor xử lý trên một luồng riêng.
                    return Mono.fromCallable(() -> uploadFileService.uploadBase64Image(base64Image))
                            .subscribeOn(Schedulers.boundedElastic()); // Đảm bảo tác vụ blocking chạy trên thread pool phù hợp
                })
                .map(UploadFileRespone::getUrl) // Bước 4: Trích xuất URL từ kết quả upload
                .doOnSuccess(url -> logger.info(">>> [PROCESS-COMPLETE] Tạo và upload ảnh thành công. URL: {}", url))
                .doOnError(e -> logger.error("!!! [PROCESS-ERROR] Đã xảy ra lỗi trong quá trình tạo và upload ảnh: {}", e.getMessage()));
    }

    // CẢI THIỆN LOGIC VÀ LOGGING CỦA PHƯƠNG THỨC NÀY
    private ImageResponseDto extractDataFromResponse(GeminiResponse geminiResponse) {
        logger.info("--- [HELPER-START] Bắt đầu trích xuất dữ liệu từ GeminiResponse...");

        if (geminiResponse == null || geminiResponse.getCandidates() == null
                || geminiResponse.getCandidates().isEmpty()) {
            logger.error("!!! [HELPER-ERROR] Phản hồi từ Gemini không hợp lệ hoặc không có candidates.");
            throw new RuntimeException("Invalid response from Gemini API: No candidates found.");
        }

        String textResponse = "";
        String base64Image = null; // Khởi tạo là null

        GeminiResponse.Content responseContent = geminiResponse.getCandidates().get(0).getContent();

        if (responseContent == null || responseContent.getParts() == null) {
            logger.error("!!! [HELPER-ERROR] Candidate không chứa 'content' hoặc 'parts'.");
            throw new RuntimeException("Invalid response format: No parts in candidate.");
        }
        
        logger.debug("--- [HELPER-CONTENT] Bắt đầu duyệt qua {} phần trong nội dung phản hồi.", responseContent.getParts().size());

        for (GeminiResponse.Part part : responseContent.getParts()) {
            logger.debug("--- [HELPER-PART-PROCESSING] Đang xử lý phần: {}", truncateBase64InString(part.toString()));
            
            if (part.getText() != null) {
                textResponse = part.getText();
                logger.debug("--- [HELPER-PART] Tìm thấy phần TEXT: '{}'", truncateBase64InData(textResponse));
            } else if (part.getInlineData() != null) {
                logger.debug("--- [HELPER-PART] Tìm thấy đối tượng 'inline_data'.");
                String data = part.getInlineData().getData();
                if (data != null && !data.isEmpty()) {
                    base64Image = data;
                    logger.debug("--- [HELPER-PART] Tìm thấy phần IMAGE. Kích thước dữ liệu: {} bytes.", base64Image.length());
                } else {
                     logger.warn("--- [HELPER-WARN] Tìm thấy 'inline_data' nhưng trường 'data' bên trong là rỗng hoặc null.");
                }
            }
        }

        if (base64Image == null) {
            logger.warn("!!! [HELPER-WARN] Trích xuất hoàn tất nhưng không tìm thấy dữ liệu hình ảnh trong phản hồi.");
            throw new RuntimeException("Invalid response from Gemini API: No image data found.");
        }

        logger.info("<<< [HELPER-END] Trích xuất dữ liệu thành công. Sẽ trả về DTO cuối cùng.");
        return new ImageResponseDto(textResponse,"data:image/png;base64," +base64Image);
    }
    /**
     * Tìm chuỗi "data": "..." trong JSON và cắt ngắn nó để log dễ hơn.
     * @param rawJson Chuỗi JSON thô từ API.
     * @return Chuỗi JSON đã được cắt ngắn.
     */
    private String truncateBase64InData(String rawJson) {
        if (rawJson == null) return null;
        // Regex để tìm: "data": "20 ký tự đầu tiên" và phần còn lại trong dấu ngoặc kép
        // và thay thế nó bằng: "data": "20 ký tự đầu tiên...(truncated)"
        // Điều này giúp log dễ đọc hơn rất nhiều.
        return rawJson.replaceAll("\"data\":\\s*\"([^\"]{20})[^\"]*\"", "\"data\": \"$1...(truncated)\"");
    }
    
    /**
     * Tìm và cắt ngắn chuỗi Base64 trong một chuỗi bất kỳ (thường là từ toString()).
     * @param inputString Chuỗi đầu vào.
     * @return Chuỗi đã được cắt ngắn.
     */
    private String truncateBase64InString(String inputString) {
        if (inputString == null) {
            return "null";
        }
        // Biểu thức chính quy (Regex) để tìm `data=` theo sau là một chuỗi ký tự base64
        // và thay thế chuỗi dài đó bằng 20 ký tự đầu tiên + "...(truncated)"
        return inputString.replaceAll("data=([a-zA-Z0-9+/]{20})[a-zA-Z0-9+/=]*", "data=$1...(truncated)");
    }
}