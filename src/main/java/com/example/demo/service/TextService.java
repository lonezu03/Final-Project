package com.example.demo.service;

import com.example.demo.entity.TtsSubJob;
import com.example.demo.repository.ITtsSubJobRepository;
import lombok.RequiredArgsConstructor;

import org.apache.http.client.config.RequestConfig;
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
/**
 * Service xử lý nghiệp vụ liên quan đến chuyển văn bản thành giọng nói (TTS),
 * chia văn bản thành các phần nhỏ phù hợp và gửi tới FPT.AI để xử lý.
 */
@Service
@RequiredArgsConstructor
public class TextService {

    private static final Logger logger = LoggerFactory.getLogger(TextService.class);
    private final ITtsSubJobRepository ttsSubJobRepository;

//    private static final String API_KEY = "Ox5oXSQpCVEATs6QYrTnLzrbodnM9qGN"; //email dh5211
    private static final String API_KEY = "FN1fx4E5lEd5Qt5FHr0RmT5xE3GHXzuj";// eduongcoder
//    private static final String API_KEY ="DrbUov7PPQqKMtgWKkF77WEk8nrdKsVC"; //Email duongtuongdruong
    private static final String API_URL = "https://api.fpt.ai/hmi/tts/v5";

    /**
     * Gửi danh sách sub-job TTS song song lên FPT.AI.
     * 
     * @param subJobs Danh sách các TtsSubJob cần xử lý
     * @param serverBaseUrl Base URL của server để tạo callback_url
     */
    public void processSubJobs(List<TtsSubJob> subJobs, String serverBaseUrl) {
        subJobs.forEach(subJob -> {
            CompletableFuture.runAsync(() -> {
                try {
                    String callbackUrl = serverBaseUrl + "/api/tts/sub-callback?subJobId=" + subJob.getId();
                    logger.info("[TTS] Sub-job {}: gửi lên FPT.AI với callback {}", subJob.getId(), callbackUrl);

                    sendToFptAi(subJob.getTextChunk(), callbackUrl);

                    subJob.setStatus("PROCESSING");
                    ttsSubJobRepository.save(subJob);
                    logger.info("[TTS] Sub-job {}: đã gửi thành công, cập nhật trạng thái PROCESSING", subJob.getId());

                } catch (Exception e) {
                    logger.error("[TTS] Sub-job {}: gửi thất bại, lỗi {}", subJob.getId(), e.getMessage(), e);
                    subJob.setStatus("FAILED");
                    ttsSubJobRepository.save(subJob);
                }
            });
        });
    }


    /**
     * Gửi một đoạn text tới FPT.AI kèm callback URL.
     *
     * @param text Đoạn văn bản đã xử lý cần chuyển thành giọng nói
     * @param callbackUrl URL sẽ được FPT.AI gọi lại khi xử lý xong
     * @throws RuntimeException nếu gửi request thất bại (timeout, lỗi mạng...)
     */
    private void sendToFptAi(String text, String callbackUrl) {
        logger.debug("Raw text before cleaning: {}", text); // 🧾 Log trước khi làm sạch

        String cleanText = text.replaceAll("\\s+", " ").trim();
        logger.debug("Cleaned text: {}", cleanText); // 🧽 Log sau khi làm sạch

        final int timeoutMillis = 30000;
        RequestConfig config = RequestConfig.custom()
            .setConnectTimeout(timeoutMillis)
            .setConnectionRequestTimeout(timeoutMillis)
            .setSocketTimeout(timeoutMillis)
            .build();

        try (CloseableHttpClient httpClient = HttpClients.custom().setDefaultRequestConfig(config).build()) {
            HttpPost request = new HttpPost(API_URL);
            request.setHeader("api-key", API_KEY);
            request.setHeader("voice", "banmai");
            request.setHeader("callback_url", callbackUrl);

            StringEntity entity = new StringEntity(cleanText, "UTF-8");
            request.setEntity(entity);

            // 🟡 Log toàn bộ request gửi đi
            logger.info("Sending request to FPT.AI with {}ms timeout", timeoutMillis);
            logger.info("Request headers:");
            Arrays.stream(request.getAllHeaders()).forEach(header ->
                logger.info("  {}: {}", header.getName(), header.getValue())
            );
            logger.info("Callback URL: {}", callbackUrl);
            logger.info("Text to synthesize (length={}): {}", cleanText.length(), cleanText);

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity(), "UTF-8");
                int statusCode = response.getStatusLine().getStatusCode();
                logger.info("FPT.AI response status: {}", statusCode);
                logger.info("FPT.AI response body: {}", responseBody);
            }

        } catch (Exception e) {
            logger.error("❌ Error sending request to FPT.AI (possibly timeout)", e);
            throw new RuntimeException("Error sending request to FPT.AI: " + e.getMessage(), e);
        }
    }



    /**
     * Chia văn bản gốc thành các đoạn nhỏ (chunk) với độ dài phù hợp để gửi đi xử lý.
     *
     * @param originalText Văn bản gốc
     * @param maxChunkLength Độ dài tối đa mỗi chunk
     * @param maxCharsWithoutBreak Số ký tự tối đa không có dấu ngắt trước khi chèn dấu phẩy
     * @return Danh sách các đoạn văn bản đã chia nhỏ
     */
    public List<String> ultimateTextSplitter(String originalText, int maxChunkLength, int maxCharsWithoutBreak) {
        logger.info("Bắt đầu chia văn bản với độ dài tối đa mỗi chunk: {} và số ký tự không dấu ngắt tối đa: {}", maxChunkLength, maxCharsWithoutBreak);

        if (originalText == null || originalText.isBlank()) {
            logger.warn("Văn bản đầu vào rỗng hoặc null.");
            return new ArrayList<>();
        }

        String cleanedText = sanitizeText(originalText);
        logger.debug("Văn bản sau khi làm sạch: ");

        String safeText = addCommasToLongStrings(cleanedText, maxCharsWithoutBreak);
        logger.debug("Văn bản sau khi thêm dấu phẩy an toàn: ");

        List<String> chunks = splitIntoChunks(safeText, maxChunkLength);
        logger.info("Hoàn tất việc chia văn bản. Số chunk thu được: {}", chunks.size());

        return chunks;
    }

    /**
     * Làm sạch văn bản bằng cách loại bỏ khoảng trắng thừa.
     */
    private String sanitizeText(String text) {
        logger.info("Tiến hành làm sạch văn bản...");
        return text.replaceAll("\\s+", " ").trim();
    }

    /**
     * Chèn dấu phẩy vào văn bản nếu có đoạn quá dài không có dấu ngắt.
     */
    private String addCommasToLongStrings(String text, int maxCharsWithoutBreak) {
        logger.debug("Adding commas to long strings. maxCharsWithoutBreak={}", maxCharsWithoutBreak);

        StringBuilder result = new StringBuilder();
        int countSinceLastBreak = 0;

        int i = 0;
        while (i < text.length()) {
            char currentChar = text.charAt(i);
            result.append(currentChar);
            countSinceLastBreak++;
            i++;

            // Reset đếm nếu gặp dấu ngắt
            if (currentChar == '.' || currentChar == ',' || currentChar == '?' || currentChar == '!') {
                logger.debug("Punctuation found at index {}: '{}', resetting countSinceLastBreak to 0", i - 1, currentChar);
                countSinceLastBreak = 0;
            }

            // Nếu đã vượt quá giới hạn
            if (countSinceLastBreak >= maxCharsWithoutBreak) {
                // Tìm khoảng trắng gần nhất sau đó
                int spaceIndex = text.indexOf(' ', i);
                logger.debug("Exceeded maxCharsWithoutBreak at index {}. Next space at index {}", i, spaceIndex);

                if (spaceIndex != -1) {
                    // Thêm phần từ i đến spaceIndex
                    result.append(text, i, spaceIndex + 1); // bao gồm khoảng trắng
                    result.append(','); // chèn dấu phẩy sau khoảng trắng
                    logger.debug("Inserted comma after space at index {}", spaceIndex);
                    i = spaceIndex + 1;
                    countSinceLastBreak = 0;
                }
            }
        }

        String finalResult = result.toString();
        logger.debug("Final result after inserting commas: {}", finalResult);
        return finalResult;
    }




    /**
     * Chia văn bản thành các đoạn nhỏ (chunk) có độ dài tối đa.
     */
    private List<String> splitIntoChunks(String text, int maxChunkLength) {
        logger.info("Tiến hành chia văn bản thành các đoạn nhỏ với độ dài tối đa: {}", maxChunkLength);

        List<String> chunks = new ArrayList<>();
        int offset = 0;

        while (offset < text.length()) {
            int end = Math.min(offset + maxChunkLength, text.length());

            if (end < text.length()) {
                int lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace != -1 && lastSpace > offset) {
                    end = lastSpace;
                }
            }

            String chunk = text.substring(offset, end).trim();
            logger.info("Tạo chunk: [{}]", chunk);
            chunks.add(chunk);

            offset = end;
        }

        return chunks;
    }
}
