package com.example.demo.service;

import com.example.demo.entity.TtsJob;
import com.example.demo.entity.TtsSubJob;
import com.example.demo.repository.ITtsJobRepository;
import com.example.demo.repository.ITtsSubJobRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AudioAssemblyService {

    private static final Logger logger = LoggerFactory.getLogger(AudioAssemblyService.class);

    private final ITtsJobRepository ttsJobRepository;
    private final ITtsSubJobRepository ttsSubJobRepository;
    private final UploadFileService cloudinaryService;
    private final HttpClient httpClient = HttpClient.newBuilder().build();
/**
 * Kích hoạt quá trình ghép các file audio nhỏ lại thành một file audio hoàn chỉnh nếu tất cả sub-job đã hoàn thành.
 * Phương thức này được gọi bất đồng bộ để không chặn luồng chính.
 * 
 * Quá trình gồm:
 * - Kiểm tra trạng thái job cha.
 * - Kiểm tra toàn bộ các sub-job đã hoàn thành.
 * - Tải từng phần âm thanh về bộ nhớ và ghép nối lại.
 * - Upload file audio hoàn chỉnh lên Cloudinary.
 * - Cập nhật trạng thái của job cha thành COMPLETED hoặc FAILED nếu lỗi xảy ra.
 *
 * @param parentJobId ID của job cha (TtsJob) cần kiểm tra và xử lý
 */
    @Async
    public void triggerAssemblyIfReady(String parentJobId) {
        // Sử dụng synchronized để tránh trường hợp nhiều callback đến cùng lúc và cố gắng ghép file
        synchronized (parentJobId.intern()) {
            TtsJob parentJob = ttsJobRepository.findById(parentJobId).orElse(null);
            if (parentJob == null || !"PROCESSING".equals(parentJob.getStatus())) {
                logger.info("Assembly check for job {} ignored, status is not PROCESSING.", parentJobId);
                return;
            }

            List<TtsSubJob> subJobs = ttsSubJobRepository.findByParentJob(parentJob);
            boolean allCompleted = subJobs.stream().allMatch(sj -> "COMPLETED".equals(sj.getStatus()));

            if (allCompleted) {
                logger.info("All sub-jobs for parent {} are complete. Starting assembly.", parentJobId);
                parentJob.setStatus("ASSEMBLING");
                ttsJobRepository.save(parentJob);

                try {
                    subJobs.sort(Comparator.comparing(TtsSubJob::getJobOrder));
                    ByteArrayOutputStream finalAudioStream = new ByteArrayOutputStream();

                    for (TtsSubJob subJob : subJobs) {
                        byte[] audioChunk = downloadFileToMemory(subJob.getTempAudioUrl());
                        if (audioChunk != null) {
                            // CẢNH BÁO: Cần thư viện chuyên dụng để ghép MP3 đúng cách.
                            // Đây là cách nối thô, có thể gây lỗi.
                            finalAudioStream.write(audioChunk);
                        } else {
                            throw new IOException("Failed to download chunk " + subJob.getId());
                        }
                    }

                    String publicId = "tts_final/" + parentJob.getId();
                    String finalUrl = cloudinaryService.uploadAudio(finalAudioStream.toByteArray(), publicId);

                    parentJob.setStatus("COMPLETED");
                    parentJob.setFinalAudioUrl(finalUrl);

                } catch (Exception e) {
                    logger.error("Failed to assemble audio for job: {}", parentJob.getId(), e);
                    parentJob.setStatus("FAILED");
                    parentJob.setErrorMessage("Audio assembly failed.");
                }
                ttsJobRepository.save(parentJob);
            }
        }
    }
/**
 * Tải nội dung file từ một URL về bộ nhớ dưới dạng mảng byte.
 * Được sử dụng để tải các đoạn âm thanh tạm từ các sub-job.
 *
 * @param url đường dẫn đến file cần tải
 * @return mảng byte chứa nội dung file nếu tải thành công, null nếu thất bại
 */
    private byte[] downloadFileToMemory(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMinutes(2))
                    .GET().build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            } else {
                logger.error("Failed to download file from URL: {}. Status code: {}", url, response.statusCode());
                return null;
            }
        } catch (Exception e) {
            logger.error("Exception during in-memory file download from URL [{}]: {}", url, e.getMessage());
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return null;
        }
    }
}