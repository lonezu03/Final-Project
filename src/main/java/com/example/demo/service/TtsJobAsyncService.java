package com.example.demo.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.demo.entity.TtsJob;
import com.example.demo.entity.TtsSubJob;
import com.example.demo.mapper.IChapterMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.IFollowNovelRepository;
import com.example.demo.repository.IHistoryNotifyRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.ITtsJobRepository;
import com.example.demo.repository.ITtsSubJobRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TtsJobAsyncService {
	ITtsJobRepository ttsJobRepository;
	ITtsSubJobRepository ttsSubJobRepository;
	TextService textService;

	@NonFinal
	@Value("${server.base-url}")
	private String serverBaseUrl;
	private static final Logger logger = LoggerFactory.getLogger(TtsJobAsyncService.class);

	/**
	 * <!--
	 * ĐÃ COMMENT LẠI KHÔNG ĐƯỢC SỬA
	 * -->
	 * 
	 * Asynchronously splits a long text into smaller chunks and creates a parent {@link TtsJob}
	 * along with its associated {@link TtsSubJob}s, then begins processing.
	 *
	 * @param longText  The full text that needs to be spoken.
	 * @param idChapter The identifier of the chapter this TTS job is associated with.
	 * @return A map containing the parent job ID and status check URL.
	 */
//	@Async
//	public Map<String, String> speakLongText(String longText, String idChapter) {
//		final int MAX_CHUNK_LENGTH = 1000; // Giới hạn cho mỗi request FPT
//		final int MAX_SENTENCE_LENGTH = 40; // Giới hạn cho mỗi câu đơn
//
//		List<String> textChunks = textService.ultimateTextSplitter(longText, MAX_CHUNK_LENGTH, MAX_SENTENCE_LENGTH);
//
//		if (textChunks.isEmpty()) {
//			throw new IllegalArgumentException("Text is empty or invalid.");
//		}
//
//		// Tạo Job chính
//		TtsJob parentJob = new TtsJob();
//		parentJob.setId(UUID.randomUUID().toString());
//		parentJob.setStatus("PENDING");
//		parentJob.setCreatedAt(new Date());
//		parentJob.setIdChapter(idChapter);
//		ttsJobRepository.save(parentJob);
//
//		// Tạo và lưu các Job con
//		List<TtsSubJob> subJobs = new ArrayList<>();
//		for (int i = 0; i < textChunks.size(); i++) {
//			TtsSubJob subJob = new TtsSubJob();
//			subJob.setParentJob(parentJob);
//			subJob.setJobOrder(i);
//			subJob.setStatus("PENDING");
//			subJob.setTextChunk(textChunks.get(i));
//			subJobs.add(subJob);
//		}
//		ttsSubJobRepository.saveAll(subJobs);
//
//		// Bắt đầu xử lý các job con và cập nhật trạng thái job chính
//		parentJob.setStatus("PROCESSING");
//		ttsJobRepository.save(parentJob);
//
//		textService.processSubJobs(subJobs, serverBaseUrl);
//
//		// Trả về ID của Job chính
//		Map<String, String> response = Map.of("message", "Request accepted. Check status URL for progress.",
//				"parentJobId", parentJob.getId(), "status_check_url", "/api/tts/status/" + parentJob.getId());
//
//		return response;
//
//	}

	/**
	 * Asynchronously handles long text-to-speech processing by:
	 * <ul>
	 *   <li>Splitting the input text into smaller chunks</li>
	 *   <li>Creating and saving a parent {@link TtsJob} with status PROCESSING</li>
	 *   <li>Creating and saving multiple {@link TtsSubJob}s with status PENDING</li>
	 *   <li>Delegating the processing of sub-jobs to the {@link TextService}</li>
	 * </ul>
	 *
	 * @param longText  The full text to convert to speech.
	 * @param idChapter The identifier for the chapter associated with this TTS job.
	 */
	@Async
	public void speakLongTextAsync(String longText, String idChapter) {
	    final int MAX_CHUNK_LENGTH = 1000;
	    final int MAX_SENTENCE_LENGTH = 40;

	    logger.info("[TTS] Bắt đầu xử lý text cho chương {}", idChapter);

	    List<String> textChunks = textService.ultimateTextSplitter(longText, MAX_CHUNK_LENGTH, MAX_SENTENCE_LENGTH);
	    if (textChunks.isEmpty()) {
	        logger.warn("[TTS] Text rỗng hoặc không hợp lệ cho chương {}", idChapter);
	        throw new IllegalArgumentException("Text is empty or invalid.");
	    }

	    logger.info("[TTS] Đã chia text thành {} đoạn", textChunks.size());

	    // Tạo Job chính
	    TtsJob parentJob = new TtsJob();
	    parentJob.setId(UUID.randomUUID().toString());
	    parentJob.setStatus("PROCESSING");
	    parentJob.setCreatedAt(new Date());
	    parentJob.setIdChapter(idChapter);
	    ttsJobRepository.save(parentJob);
	    logger.info("[TTS] Đã tạo job chính với ID {}", parentJob.getId());

	    // Tạo và lưu các Job con
	    List<TtsSubJob> subJobs = new ArrayList<>();
	    for (int i = 0; i < textChunks.size(); i++) {
	        TtsSubJob subJob = new TtsSubJob();
	        subJob.setParentJob(parentJob);
	        subJob.setJobOrder(i);
	        subJob.setStatus("PENDING");
	        subJob.setTextChunk(textChunks.get(i));
	        subJobs.add(subJob);
	    }
	    ttsSubJobRepository.saveAll(subJobs);
	    logger.info("[TTS] Đã tạo và lưu {} sub-job cho job chính {}", subJobs.size(), parentJob.getId());

	    // Gửi đi xử lý
	    textService.processSubJobs(subJobs, serverBaseUrl);
	    logger.info("[TTS] Đã bắt đầu gửi các sub-job đi xử lý");
	}

}

