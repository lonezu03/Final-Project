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

    public List<String> ultimateTextSplitter(String originalText, int maxChunkLength, int maxWordsWithoutBreak) {
        if (originalText == null || originalText.isBlank()) {
            return new ArrayList<>();
        }

        // 1. Dọn dẹp văn bản thô (loại bỏ các lỗi định dạng nhỏ)
        String cleanedText = sanitizeText(originalText);

        // 2. Tách văn bản thành các câu
        List<String> initialSentences = splitIntoSentences(cleanedText);

        // 3. Xử lý các câu dài bằng cách chèn dấu phẩy
        List<String> safeSentences = new ArrayList<>();
        for (String sentence : initialSentences) {
            safeSentences.add(addCommasToLongSentence(sentence, maxWordsWithoutBreak));
        }

        // 4. Ghép các câu an toàn lại thành các chunk
        return assembleChunks(safeSentences, maxChunkLength);
    }

    /**
     * Dọn dẹp các lỗi cú pháp và khoảng trắng phổ biến.
     */
    private String sanitizeText(String text) {
        return text.replaceAll("\\s+", " ").trim() // Chuẩn hóa khoảng trắng
                   .replaceAll(" ,", ",")          // Xóa khoảng trắng trước dấu phẩy
                   .replaceAll(" \\.", ".")         // Xóa khoảng trắng trước dấu chấm
                   .replaceAll(",\\.", ".");        // Thay thế ",." bằng "."
    }

    /**
     * Tách một đoạn văn bản thành một danh sách các câu.
     */
    private List<String> splitIntoSentences(String text) {
        // Biểu thức chính quy này tốt hơn, nó xử lý được nhiều trường hợp hơn
        return Arrays.stream(text.split("(?<=[.?!])\\s*"))
                     .map(String::trim)
                     .filter(s -> !s.isEmpty())
                     .collect(Collectors.toList());
    }

    /**
     * Tự động chèn dấu phẩy vào những câu dài không có điểm ngắt nghỉ.
     *
     * @param sentence Câu cần xử lý.
     * @param maxWordsWithoutBreak Số từ tối đa cho phép giữa hai dấu câu.
     * @return Câu đã được chèn dấu phẩy (nếu cần).
     */
    private String addCommasToLongSentence(String sentence, int maxWordsWithoutBreak) {
        // Nếu câu đã có dấu phẩy hoặc ngắn thì không cần xử lý
        if (sentence.contains(",") || sentence.split("\\s+").length <= maxWordsWithoutBreak) {
            return sentence;
        }

        List<String> words = new ArrayList<>(Arrays.asList(sentence.split("\\s+")));
        StringBuilder result = new StringBuilder();
        
        int wordCount = 0;
        for (int i = 0; i < words.size(); i++) {
            result.append(words.get(i)).append(" ");
            wordCount++;
            
            // Nếu đã đủ số từ và đây không phải là từ cuối cùng của câu
            if (wordCount >= maxWordsWithoutBreak && i < words.size() - 1) {
                // Lấy từ tiếp theo để xem nó có phải dấu kết thúc câu không
                String nextWord = words.get(i + 1);
                if (!nextWord.endsWith(".") && !nextWord.endsWith("?") && !nextWord.endsWith("!")) {
                    result.append(", "); // Chèn dấu phẩy và khoảng trắng
                    wordCount = 0; // Reset bộ đếm
                }
            }
        }
        
        return result.toString().trim();
    }


    /**
     * Ghép một danh sách các câu "an toàn" thành các chunk lớn hơn.
     */
    private List<String> assembleChunks(List<String> sentences, int maxChunkLength) {
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();

        for (String sentence : sentences) {
            // Nếu một câu đơn đã dài hơn cả chunk, hãy chia nhỏ nó ra trước
            if (sentence.length() > maxChunkLength) {
                // Hoàn thành chunk hiện tại trước khi xử lý câu dài
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                }
                
                // Chia nhỏ câu quá dài này thành nhiều phần
                int offset = 0;
                while (offset < sentence.length()) {
                    int end = Math.min(offset + maxChunkLength, sentence.length());
                    // Cố gắng tìm khoảng trắng gần nhất để cắt cho đẹp
                    int lastSpace = sentence.substring(offset, end).lastIndexOf(' ');
                    if (end < sentence.length() && lastSpace > 0) {
                        end = offset + lastSpace;
                    }
                    chunks.add(sentence.substring(offset, end).trim());
                    offset = end;
                }
                continue; // Chuyển sang câu tiếp theo
            }
            
            // Nếu thêm câu mới sẽ làm chunk vượt quá giới hạn
            if (currentChunk.length() + sentence.length() + 1 > maxChunkLength) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder(sentence);
            } else {
                // Nếu chưa vượt quá, tiếp tục thêm vào
                if (currentChunk.length() > 0) {
                    currentChunk.append(" ");
                }
                currentChunk.append(sentence);
            }
        }

        // Thêm chunk cuối cùng vào danh sách
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }
    
    
}