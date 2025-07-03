package com.example.demo.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.ChapterCreationRequest;
import com.example.demo.dto.request.ChapterGetByIdNovelRequest;
import com.example.demo.dto.request.ChapterUpdateRequest;
import com.example.demo.dto.request.HistoryNotityCreationRequest;
import com.example.demo.dto.request.IntrospectRequest;
import com.example.demo.dto.respone.ChapterRespone;
import com.example.demo.dto.respone.IntrospectRespone;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.HistoryNotify;
import com.example.demo.entity.Novel;
import com.example.demo.entity.TtsJob;
import com.example.demo.entity.TtsSubJob;
import com.example.demo.entity.User;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IChapterMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.IFollowNovelRepository;
import com.example.demo.repository.IHistoryNotifyRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.ITtsJobRepository;
import com.example.demo.repository.ITtsSubJobRepository;
import com.example.demo.repository.IUserRepository;
import com.nimbusds.jose.JOSEException;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChapterService {

	IChapterMapper chapterMapper;
	IChapterRepository chapterRepository;
	INovelRepository novelRepository;
	TextService textService;
	AuthenticationService authenticationService;
	IHistoryNotifyRepository historyNotifyRepository;
	IUserRepository userRepository;
	IFollowNovelRepository followNovelRepository;
	ITtsJobRepository ttsJobRepository;
	ITtsSubJobRepository ttsSubJobRepository;
	TtsJobAsyncService ttsJobAsyncService;
	private static final Logger logger = LoggerFactory.getLogger(ChapterService.class);

	// public List<ChapterRespone> getAll(){
	// return chapterRepository.getAll().stream().map(t ->
	// chapterMapper.toChapterRespone(t)).toList();
	// }

	public List<ChapterRespone> getAllChapter(ChapterGetByIdNovelRequest request) throws JOSEException, ParseException {

		if (request.getToken() != null) {

			IntrospectRespone introspectRespone = authenticationService
					.introspect(IntrospectRequest.builder().token(request.getToken()).build());

			if (introspectRespone.isValid()) {
				List<ChapterRespone> chapters = chapterRepository.findByNovel_IdNovel(request.getIdNovel()).stream()
						.map(t -> {
							ChapterRespone chapterRespone = chapterMapper.toChapterRespone(t);

							if (ttsJobRepository.findByIdChapter(chapterRespone.getIdChapter()).isPresent()) {
								TtsJob ttsJobOpt = ttsJobRepository.findByIdChapter(chapterRespone.getIdChapter())
										.get();
								logger.info(ttsJobOpt.getFinalAudioUrl());
								chapterRespone.setUrlAudio(ttsJobOpt.getFinalAudioUrl());
							}

							return chapterRespone;
						}).collect(Collectors.toList());

				if (chapters.isEmpty()) {
					throw new AppException(ErrorCode.CHAPTER_EMPTY);
				}
				return chapters;
			} else {
				throw new AppException(ErrorCode.UNAUTHENTICATION);
			}

		} else {
			return chapterRepository.findByNovel_IdNovel(request.getIdNovel()).stream().map(t -> {

				ChapterRespone chapterRespone = new ChapterRespone();
				chapterRespone.setTitleChapter(t.getTitleChapter());
				return chapterRespone;
			}).collect(Collectors.toList());
		}

	}

	public ChapterRespone getChapterById(String idChapter) {
		return chapterMapper.toChapterRespone(chapterRepository.findById(idChapter).get());
	}

	@Transactional
	public ChapterRespone createChapter(ChapterCreationRequest request, MultipartFile textFile)
			throws IOException, InterruptedException {
		if (chapterRepository.existsByTitleChapter(request.getTitleChapter())) {
			throw new AppException(ErrorCode.CHAPTER_EXISTSED);
		}
		Chapter chapter = chapterMapper.toChapter(request);

		Novel novel = novelRepository.findById(request.getNovel()).get();

		if (chapter.getIndexChapter() == null) {
			Long lastChapterNumber = chapterRepository.findTopByNovelOrderByIndexChapterDesc(novel)
					.map(Chapter::getIndexChapter) // Lấy ra chapterNumber từ chapter cuối cùng
					.orElse((long) 0); // Nếu chưa có chương nào, trả về 0
			chapter.setIndexChapter(lastChapterNumber + 1);

		}

		chapter.setNovel(novel);
		chapter.setViewChapter(0);
		Boolean isHaveFile = false;
		if (textFile != null && !textFile.isEmpty()) {
			String originalFilename = textFile.getOriginalFilename();
			if (originalFilename != null && originalFilename.toLowerCase().endsWith(".txt")) {
				String cotent = new String(textFile.getBytes(), StandardCharsets.UTF_8);
//				logger.info(cotent);

				isHaveFile = true;
//				String parentJobId = map.get("parentJobId");
//			    ttsSubJobRepository.existsByParentJobIdAndStatus( parentJobId, status);
				chapter.setContentChapter(cotent);
//				chapter.setAudioFile(parentJobId);
			} else {
				throw new AppException(ErrorCode.FILE_MUST_TXT);
			}
		}
		novel.setTotalChapter(novel.getTotalChapter() + 1);
		novelRepository.save(novel);

		chapter = chapterRepository.save(chapter);
		if (isHaveFile) {
			ttsJobAsyncService.speakLongTextAsync(chapter.getContentChapter(), chapter.getIdChapter());

		}

		List<FollowNovel> followNovels = followNovelRepository.findByNovel_IdNovel(chapter.getNovel().getIdNovel());

		for (FollowNovel followNovel : followNovels) {
			try {
				HistoryNotityCreationRequest historyNotityCreationRequest = HistoryNotityCreationRequest.builder()
						.user(followNovel.getUser()).nameNovel(followNovel.getNovel().getNameNovel())
						.titleChapter(chapter.getTitleChapter()).build();
				createHistoryNotify(historyNotityCreationRequest);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		return chapterMapper.toChapterRespone(chapter);
	}

	public String deleteChapter(String idChapter) {
		Chapter chapter = chapterRepository.findById(idChapter)
				.orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));
		Novel novel = novelRepository.findById(chapter.getNovel().getIdNovel()).get();
		try {
			chapterRepository.deleteById(idChapter);
			novel.setTotalChapter(novel.getTotalChapter() - 1);
			novelRepository.save(novel);
		} catch (Exception e) {
			throw new AppException(ErrorCode.DELETE_CONTRAINT);
		}
		return idChapter;
	}

	public Integer increaseView(String idChapter) {
		Chapter chapter = chapterRepository.findById(idChapter).get();
		chapter.setViewChapter(chapter.getViewChapter() + 1);
		chapterRepository.save(chapter);
		return chapter.getViewChapter();
	}

	public ChapterRespone updateChapter(ChapterUpdateRequest request, MultipartFile textFile) throws IOException {
		Chapter chapterOgirin = chapterRepository.findById(request.getIdChapter()).get();
		Chapter chapter = chapterMapper.toChapterUpdate(request);

		chapterOgirin = chapterMapper.toChapterbyChapter(chapter);
		if (!chapterRepository.existsById(request.getIdChapter())) {
			throw new AppException(ErrorCode.CHAPTER_NOT_EXISTED);
		}

		Novel novel = novelRepository.findById(request.getNovel()).get();

		chapterOgirin.setNovel(novel);
		if (textFile != null && !textFile.isEmpty()) {
			String originalFilename = textFile.getOriginalFilename();
			if (originalFilename != null && originalFilename.toLowerCase().endsWith(".txt")) {
				String cotent = new String(textFile.getBytes(), StandardCharsets.UTF_8);
				chapterOgirin.setContentChapter(cotent);
			} else {
				throw new AppException(ErrorCode.FILE_MUST_TXT);
			}
		}
		try {
			chapterOgirin = chapterRepository.save(chapterOgirin);
		} catch (Exception e) {
			e.printStackTrace();
		}

		return chapterMapper.toChapterRespone(chapterOgirin);
	}

	public Boolean createHistoryNotify(HistoryNotityCreationRequest request) {
		try {

			HistoryNotify historyNotify = HistoryNotify.builder().user(request.getUser()).dateNotify(null)
					.nameNovel(request.getNameNovel()).titleChapter(request.getTitleChapter()).isNotify(false).build();

			historyNotifyRepository.save(historyNotify);
			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

}
