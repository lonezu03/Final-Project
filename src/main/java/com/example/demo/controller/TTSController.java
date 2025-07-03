package com.example.demo.controller;

import com.example.demo.entity.TtsJob;
import com.example.demo.entity.TtsSubJob;
import com.example.demo.repository.ITtsJobRepository;
import com.example.demo.repository.ITtsSubJobRepository;
import com.example.demo.service.AudioAssemblyService;
import com.example.demo.service.TextService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TTSController {

	private static final Logger logger = LoggerFactory.getLogger(TTSController.class);

	// Các service và repository cần thiết cho Controller
	TextService textService;
	AudioAssemblyService audioAssemblyService;
	ITtsJobRepository ttsJobRepository;
	ITtsSubJobRepository ttsSubJobRepository;

	@NonFinal
	@Value("${server.base-url}")
	private String serverBaseUrl;

	/**
	 * Nếu như 1 câu đơn dài hơn 80 ký tự không có dấu ngắt câu hay nghỉ câu thì nó sẽ không gen ra được
	 * @param longText
	 * @return
	 */
	
	@PostMapping("/speak-long-text")
	public ResponseEntity<?> speakLongText(@RequestBody String longText) {
		final int MAX_CHUNK_LENGTH = 1000; // Giới hạn cho mỗi request FPT
		final int MAX_SENTENCE_LENGTH = 40; // Giới hạn cho mỗi câu đơn

		List<String> textChunks = textService.ultimateTextSplitter(longText, MAX_CHUNK_LENGTH, MAX_SENTENCE_LENGTH);

		if (textChunks.isEmpty()) {
			return ResponseEntity.badRequest().body("Text is empty or invalid.");
		}

		// Tạo Job chính
		TtsJob parentJob = new TtsJob();
		parentJob.setId(UUID.randomUUID().toString());
		parentJob.setStatus("PENDING");
		parentJob.setCreatedAt(new Date());
		ttsJobRepository.save(parentJob);

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

		// Bắt đầu xử lý các job con và cập nhật trạng thái job chính
		parentJob.setStatus("PROCESSING");
		ttsJobRepository.save(parentJob);

		textService.processSubJobs(subJobs, serverBaseUrl);

		// Trả về ID của Job chính
		Map<String, String> response = Map.of("message", "Request accepted. Check status URL for progress.",
				"parentJobId", parentJob.getId(), "status_check_url", "/api/tts/status/" + parentJob.getId());
		return ResponseEntity.accepted().body(response);
	}

	@PostMapping("/sub-callback")
	public ResponseEntity<?> handleSubJobCallback(@RequestBody Map<String, Object> callbackPayload,
			@RequestParam("subJobId") Long subJobId) {

		logger.info("Received callback for subJobId [{}]: {}", subJobId, callbackPayload);

		return ttsSubJobRepository.findById(subJobId).map(subJob -> {
			if (!"PROCESSING".equals(subJob.getStatus())) {
				logger.warn("Callback for sub-job {} ignored, current status: {}", subJobId, subJob.getStatus());
				return ResponseEntity.ok().build();
			}

			boolean success = Boolean.parseBoolean(String.valueOf(callbackPayload.get("success")));
			if (success) {
				String asyncUrl = (String) callbackPayload.get("message");
				subJob.setStatus("COMPLETED");
				subJob.setTempAudioUrl(asyncUrl);
				ttsSubJobRepository.save(subJob);

				// Kích hoạt tác vụ kiểm tra và ghép nối
				audioAssemblyService.triggerAssemblyIfReady(subJob.getParentJob().getId());
			} else {
				subJob.setStatus("FAILED");
				ttsSubJobRepository.save(subJob);
				// Cân nhắc cập nhật job cha là FAILED ở đây
				// Ví dụ: audioAssemblyService.failParentJob(subJob.getParentJob().getId(), "A
				// sub-job failed.");
			}
			return ResponseEntity.ok().build();
		}).orElseGet(() -> {
			logger.error("Callback received for an unknown subJobId: {}", subJobId);
			return ResponseEntity.badRequest().build();
		});
	}

	@GetMapping("/status/{parentJobId}")
	public ResponseEntity<?> getJobStatus(@PathVariable String parentJobId) {
		return ttsJobRepository.findById(parentJobId).map(job -> {
			Map<String, Object> response = new HashMap<>();
			response.put("jobId", job.getId());
			response.put("status", job.getStatus());
			if ("COMPLETED".equals(job.getStatus())) {
				response.put("final_audio_url", job.getFinalAudioUrl());
			} else if ("FAILED".equals(job.getStatus())) {
				response.put("error", job.getErrorMessage());
			}
			return ResponseEntity.ok(response);
		}).orElse(ResponseEntity.notFound().build());
	}
}