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

    private static final String API_KEY = "FN1fx4E5lEd5Qt5FHr0RmT5xE3GHXzuj"; // Nên đưa vào application.properties
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

    /**
     * Gửi một đoạn text tới FPT.AI kèm callback URL.
     *
     * @param text Đoạn văn bản đã xử lý cần chuyển thành giọng nói
     * @param callbackUrl URL sẽ được FPT.AI gọi lại khi xử lý xong
     * @throws RuntimeException nếu gửi request thất bại (timeout, lỗi mạng...)
     */
    private void sendToFptAi(String text, String callbackUrl) {
        String cleanText = text.replaceAll("\\s+", " ").trim();

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

            logger.info("Sending request to FPT.AI with a {}ms timeout...", timeoutMillis);
            logger.info("Callback URL: {}", callbackUrl);

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity(), "UTF-8");
                logger.info("FPT.AI initial response: {}", responseBody);
            }

        } catch (Exception e) {
            logger.error("Error sending request to FPT.AI (possible timeout)", e);
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
        if (originalText == null || originalText.isBlank()) {
            return new ArrayList<>();
        }

        String cleanedText = sanitizeText(originalText);
        String safeText = addCommasToLongStrings(cleanedText, maxCharsWithoutBreak);
        return splitIntoChunks(safeText, maxChunkLength);
    }

    /**
     * Làm sạch văn bản bằng cách loại bỏ khoảng trắng thừa.
     *
     * @param text Văn bản thô
     * @return Văn bản đã làm sạch
     */
    private String sanitizeText(String text) {
        return text.replaceAll("\\s+", " ").trim();
    }

    /**
     * Chèn dấu phẩy vào văn bản nếu có đoạn quá dài không có dấu ngắt.
     *
     * @param text Văn bản cần xử lý
     * @param maxLength Số ký tự tối đa giữa các dấu ngắt
     * @return Văn bản đã được thêm dấu phẩy
     */
    private String addCommasToLongStrings(String text, int maxLength) {
    	StringBuilder result = new StringBuilder();
    	int lastBreak = -1; // vị trí dấu ngắt cuối cùng (.,!? hoặc ,)

    	for (int i = 0; i < text.length(); i++) {
    		char currentChar = text.charAt(i);
    		result.append(currentChar);

    		// Nếu là dấu ngắt, reset vị trí
    		if (currentChar == '.' || currentChar == '?' || currentChar == '!' || currentChar == ',') {
    			lastBreak = result.length() - 1;
    		}

    		// Nếu đã vượt quá maxLength từ lần ngắt trước
    		if (lastBreak != -1 && (result.length() - lastBreak) >= maxLength) {
    			int insertPos = result.lastIndexOf(" ", result.length() - 1);
    			if (insertPos > lastBreak) {
    				result.insert(insertPos, ',');
    				lastBreak = insertPos;
    			} else {
    				// Nếu không có khoảng trắng, chèn luôn tại vị trí hiện tại
    				result.insert(result.length() - 1, ',');
    				lastBreak = result.length() - 2;
    			}
    		}
    	}

    	return result.toString();
    }


    /**
     * Chia văn bản thành các đoạn nhỏ (chunk) có độ dài tối đa.
     *
     * @param text Văn bản đã xử lý
     * @param maxChunkLength Độ dài tối đa mỗi chunk
     * @return Danh sách các đoạn đã cắt
     */
    private List<String> splitIntoChunks(String text, int maxChunkLength) {
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

            chunks.add(text.substring(offset, end).trim());
            offset = end;
        }
        return chunks;
    }
}
