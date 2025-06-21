package com.example.demo.service;

import com.example.demo.entity.TtsSubJob;
import com.example.demo.repository.ITtsSubJobRepository;
import lombok.RequiredArgsConstructor;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TextService {

    private static final Logger logger = LoggerFactory.getLogger(TextService.class);
    private final ITtsSubJobRepository ttsSubJobRepository;

    private static final String API_KEY = "FN1fx4E5lEd5Qt5FHr0RmT5xE3GHXzuj"; // Nên đưa vào application.properties
    private static final String API_URL = "https://api.fpt.ai/hmi/tts/v5";

    public void processSubJobs(List<TtsSubJob> subJobs, String serverBaseUrl) {
        subJobs.forEach(subJob -> {
            CompletableFuture.runAsync(() -> {
                try {
                    String callbackUrl = serverBaseUrl + "/api/tts/sub-callback?subJobId=" + subJob.getId();
                    sendToFptAi(subJob.getTextChunk(), callbackUrl);
                    
                    subJob.setStatus("PROCESSING");
                    ttsSubJobRepository.save(subJob);
                } catch (Exception e) {
                    logger.error("Failed to send sub-job {} to FPT.AI", subJob.getId(), e);
                    subJob.setStatus("FAILED");
                    ttsSubJobRepository.save(subJob);
                    // Cân nhắc cập nhật job cha là FAILED
                }
            });
        });
    }
    
    private void sendToFptAi(String text, String callbackUrl) {
        String cleanText = text.replaceAll("\\s+", " ").trim();
        
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost request = new HttpPost(API_URL);
            request.setHeader("api-key", API_KEY);
            request.setHeader("voice", "banmai");
            request.setHeader("callback_url", callbackUrl);

            StringEntity entity = new StringEntity(cleanText, "UTF-8");
            request.setEntity(entity);

            logger.info("Sending request to FPT.AI for sub-job via callback: {}", callbackUrl);
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                 String responseBody = EntityUtils.toString(response.getEntity(), "UTF-8");
                 logger.info("FPT.AI initial response: {}", responseBody);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error sending request to FPT.AI", e);
        }
    }

    public List<String> ultimateTextSplitter(String originalText, int maxChunkLength, int maxCharsWithoutBreak) {
        if (originalText == null || originalText.isBlank()) {
            return new ArrayList<>();
        }

        // 1. Dọn dẹp văn bản thô
        String cleanedText = sanitizeText(originalText);

        // 2. Chèn dấu phẩy vào các đoạn quá dài
        String safeText = addCommasToLongStrings(cleanedText, maxCharsWithoutBreak);

        // 3. Chia văn bản đã an toàn thành các chunk
        return splitIntoChunks(safeText, maxChunkLength);
    }

    private String sanitizeText(String text) {
        return text.replaceAll("\\s+", " ").trim();
    }
    
    // =========================================================================
    // === HÀM MỚI: CHÈN DẤU PHẨY THEO ĐỘ DÀI KÝ TỰ ===
    // =========================================================================
    /**
     * Chèn dấu phẩy vào văn bản để đảm bảo không có đoạn nào dài quá `maxLength`
     * mà không có dấu ngắt nghỉ ('.' '?' '!' hoặc ',').
     *
     * @param text Văn bản cần xử lý.
     * @param maxLength Độ dài ký tự tối đa cho phép.
     * @return Văn bản đã được chèn dấu phẩy.
     */
    private String addCommasToLongStrings(String text, int maxLength) {
        StringBuilder result = new StringBuilder();
        int lastBreak = 0; // Vị trí của dấu ngắt nghỉ cuối cùng

        for (int i = 0; i < text.length(); i++) {
            char currentChar = text.charAt(i);
            result.append(currentChar);

            // Nếu ký tự hiện tại là một dấu ngắt nghỉ tự nhiên
            if (currentChar == '.' || currentChar == '?' || currentChar == '!' || currentChar == ',') {
                lastBreak = i; // Cập nhật vị trí ngắt nghỉ cuối cùng
            }
            
            // Nếu khoảng cách từ lần ngắt nghỉ cuối cùng đã vượt quá giới hạn
            if (i - lastBreak >= maxLength) {
                // Tìm một khoảng trắng gần nhất để chèn dấu phẩy cho "đẹp"
                int insertPos = result.lastIndexOf(" ", i);
                
                if (insertPos != -1 && insertPos > lastBreak) {
                    // Chèn dấu phẩy vào vị trí khoảng trắng đó
                    result.insert(insertPos, ',');
                    lastBreak = insertPos; // Cập nhật lại vị trí ngắt nghỉ
                }
                // Nếu không tìm thấy khoảng trắng, nó sẽ tiếp tục cho đến khi tìm thấy
                // hoặc đến khi gặp dấu ngắt nghỉ tự nhiên tiếp theo.
            }
        }
        return result.toString();
    }


    /**
     * Chia một đoạn văn bản (đã an toàn) thành các chunk có độ dài tối đa.
     * Cách này đơn giản hơn vì ta không cần lo về các câu quá dài nữa.
     */
    private List<String> splitIntoChunks(String text, int maxChunkLength) {
        List<String> chunks = new ArrayList<>();
        int offset = 0;
        while (offset < text.length()) {
            int end = Math.min(offset + maxChunkLength, text.length());
            
            // Nếu chưa phải cuối văn bản, tìm khoảng trắng gần nhất để cắt
            if (end < text.length()) {
                int lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace != -1 && lastSpace > offset) {
                    end = lastSpace;
                }
            }
            
            chunks.add(text.substring(offset, end).trim());
            offset = end;
        }
        return chunks;
    }
    
}