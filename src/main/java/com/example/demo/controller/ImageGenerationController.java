package com.example.demo.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.request.ImageRequestDto;
import com.example.demo.dto.respone.ImageGenerationResponse;
import com.example.demo.dto.respone.ImageResponseDto;
import com.example.demo.service.GeminiService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/images")
@Slf4j
public class ImageGenerationController {

    private final GeminiService geminiService;

    public ImageGenerationController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

//    @PostMapping("/generate")
//    public Mono<ResponseEntity<ImageResponseDto>> generateImage(@RequestBody ImageRequestDto request) {
//        if (request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
//            // Trả về lỗi nếu prompt rỗng
//            return Mono.just(ResponseEntity.badRequest().build());
//        }
//        
//        return geminiService.generateImage(request.getPrompt())
//                .map(ResponseEntity::ok) // Nếu thành công, trả về status 200 OK
//                .onErrorResume(e -> Mono.just(ResponseEntity.status(500).body(new ImageResponseDto(e.getMessage(), null))));
//    }
    

    /**
     * Endpoint để tạo một hình ảnh dựa trên prompt và upload nó lên cloud.
     *
     * @param request Đối tượng chứa prompt từ client.
     * @return Mono chứa URL của hình ảnh đã được upload.
     */
    @PostMapping("/generate")
    public Mono<ResponseEntity<ImageGenerationResponse>> generateImage(
            @Valid @RequestBody ImageRequestDto request) {
        
        log.info(">>> Nhận được yêu cầu tạo ảnh với prompt: '{}'", request.getPrompt());

        // Gọi phương thức service đã được viết trước đó
        return geminiService.generateAndUploadImage(request.getPrompt())
                .map(imageUrl -> {
                    // Khi thành công, bọc URL trong DTO response
                    ImageGenerationResponse response = new ImageGenerationResponse(imageUrl);
                    // Trả về 200 OK cùng với body là response DTO
                    return ResponseEntity.ok(response);
                })
                .doOnError(e -> log.error("!!! Lỗi trong quá trình xử lý của controller: {}", e.getMessage()))
                // Nếu Mono rỗng (ít khả năng xảy ra) hoặc có lỗi trước đó, trả về lỗi server
                .defaultIfEmpty(ResponseEntity.status(500).build());
    }
    
    @GetMapping("/ping")
    public String ping() {
        return "Pong!";
    }
}