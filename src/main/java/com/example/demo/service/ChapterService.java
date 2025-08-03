package com.example.demo.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.ChapterCreationRequest;
import com.example.demo.dto.request.ChapterGetByIdNovelRequest;
import com.example.demo.dto.request.ChapterUpdateRequest;
import com.example.demo.dto.request.HistoryNotityCreationRequest;
import com.example.demo.dto.request.IntrospectRequest;
import com.example.demo.dto.respone.ChapterRespone;
import com.example.demo.dto.respone.IntrospectRespone;
import com.example.demo.entity.Category;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.HistoryNotify;
import com.example.demo.entity.Novel;
import com.example.demo.entity.TtsJob;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IChapterMapper;
import com.example.demo.repository.ICategoryRepository;
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
	ICategoryRepository categoryRepository;
	private static final Logger logger = LoggerFactory.getLogger(ChapterService.class);

	// public List<ChapterRespone> getAll(){
	// return chapterRepository.getAll().stream().map(t ->
	// chapterMapper.toChapterRespone(t)).toList();
	// }
	/**
	 * Lấy tất cả các chương thuộc một truyện cụ thể. Nếu có token được cung cấp và
	 * hợp lệ, thì sẽ bao gồm thêm thông tin về audio nếu có.
	 *
	 * @param request yêu cầu chứa ID của truyện và token (nếu có)
	 * @return danh sách các chương, kèm theo URL audio nếu có
	 * @throws JOSEException  nếu có lỗi khi phân tích token
	 * @throws ParseException nếu token không đúng định dạng
	 */
	public List<ChapterRespone> getAllChapter(ChapterGetByIdNovelRequest request) throws JOSEException, ParseException {

		if (request.getToken() != null) {

			IntrospectRespone introspectRespone = authenticationService
					.introspect(IntrospectRequest.builder().token(request.getToken()).build());

			if (introspectRespone.isValid()) {
				List<ChapterRespone> chapters = chapterRepository.findByNovel_IdNovel(request.getIdNovel()).stream()
						.map(t -> {
							ChapterRespone chapterRespone = chapterMapper.toChapterRespone(t);

							List<TtsJob> ttsJobs = ttsJobRepository.findByIdChapter(chapterRespone.getIdChapter());
							if (!ttsJobs.isEmpty() && ttsJobs != null) {
								// Lấy job mới nhất theo ngày tạo
								TtsJob latestJob = ttsJobs.stream().max(Comparator.comparing(TtsJob::getCreatedAt))
										.orElse(null);

								if (latestJob != null ) {
									if (latestJob.getFinalAudioUrl()!= null && !latestJob.getFinalAudioUrl().isEmpty()) {
										chapterRespone.setUrlAudio(latestJob.getFinalAudioUrl());

									}
//									if (latestJob.getAudioBlob()!= null ) {
//										chapterRespone.setAudioBlob(latestJob.getAudioBlob());
//
//									}
								}
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
				chapterRespone.setIdChapter(t.getIdChapter());
				chapterRespone.setTitleChapter(t.getTitleChapter());
				chapterRespone.setIndexChapter(t.getIndexChapter());
				chapterRespone.setCoinPrice(t.getCoinPrice());
				chapterRespone.setCointRentPrice(t.getCointRentPrice());
				chapterRespone.setDayRentAmount(t.getDayRentAmount());
				
				return chapterRespone;
			}).collect(Collectors.toList());
		}

	}

	/**
	 * Lấy thông tin chi tiết của một chương theo ID.
	 *
	 * @param idChapter ID của chương
	 * @return đối tượng ChapterRespone tương ứng
	 */
	public ChapterRespone getChapterById(String idChapter) {

		Chapter chapters = chapterRepository.findById(idChapter)
				.orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));

		ChapterRespone chapterRespone = chapterMapper.toChapterRespone(chapters);

		List<TtsJob> ttsJobs = ttsJobRepository.findByIdChapter(chapterRespone.getIdChapter());
		if (ttsJobs != null && !ttsJobs.isEmpty()) {
			// Lấy job mới nhất theo ngày tạo
			TtsJob latestJob = ttsJobs.stream().max(Comparator.comparing(TtsJob::getCreatedAt)).orElse(null);

			if (latestJob != null) {
				chapterRespone.setUrlAudio(latestJob.getFinalAudioUrl());
			}
		}

		return chapterRespone;
	}

	/**
	 * Tạo một chương mới cho truyện. Nếu có file văn bản đính kèm (.txt), nội dung
	 * sẽ được đọc và lưu vào chương. Ngoài ra, tự động tạo job chuyển văn bản thành
	 * giọng nói (TTS) nếu có nội dung. Cập nhật tổng số chương của truyện và gửi
	 * thông báo đến người theo dõi.
	 *
	 * @param request  thông tin yêu cầu tạo chương
	 * @param textFile file văn bản (.txt) chứa nội dung chương
	 * @return chương vừa được tạo dưới dạng ChapterRespone
	 * @throws IOException          nếu xảy ra lỗi khi đọc file
	 * @throws InterruptedException nếu bị gián đoạn khi xử lý bất đồng bộ
	 */
	@Transactional
	public ChapterRespone createChapter(ChapterCreationRequest request, MultipartFile textFile)
			throws IOException, InterruptedException {
		List<Chapter> chapters = chapterRepository.findByTitleChapter(request.getTitleChapter()).get();
		boolean isDuplicate = chapters.stream()
				.filter(chapter -> chapter.getNovel().getIdNovel().equals(request.getNovel())).findAny().isPresent();

		if (isDuplicate) {
			throw new AppException(ErrorCode.CHAPTER_EXISTSED);
		}

		Chapter chapter = chapterMapper.toChapter(request);
		
		
		Category category = categoryRepository.findByNameCategory("Truyện Convert");
		Category category2 = categoryRepository.findByNameCategory("Truyện Dịch");

		Novel novel = novelRepository.findById(request.getNovel()).get();

		
		chapter.setNovel(novel);
		if (chapter.getNovel().getCategories()!=null && !chapter.getNovel().getCategories().isEmpty() ) {
			if (chapter.getNovel().getCategories().contains(category) && chapter.getCoinPrice()!=0) {
					throw new AppException(ErrorCode.NOVEL_CONVERT_CANNOT_HAVE_PRICE);
			}
			if (!chapter.getNovel().getCategories().contains(category2)&& chapter.getCoinPrice()!=0 ) {
				throw new AppException(ErrorCode.NOVEL_CONVERT_CANNOT_HAVE_PRICE);
			}
		}

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
				isHaveFile = true;
				chapter.setContentChapter(cotent);
			} else {
				throw new AppException(ErrorCode.FILE_MUST_TXT);
			}
		}

		if (novel.getTotalChapter() != null) {
			novel.setTotalChapter(novel.getTotalChapter() + 1);

		} else {
			novel.setTotalChapter(0);

		}
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

	/**
	 * Xoá một chương khỏi truyện và cập nhật lại tổng số chương.
	 *
	 * @param idChapter ID của chương cần xoá
	 * @return ID của chương vừa bị xoá
	 * @throws AppException nếu chương không tồn tại hoặc có ràng buộc không thể xoá
	 */
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

	/**
	 * Tăng số lượt xem cho một chương.
	 *
	 * @param idChapter ID của chương
	 * @return tổng số lượt xem sau khi tăng
	 */
	public Integer increaseView(String idChapter) {
		Chapter chapter = chapterRepository.findById(idChapter).get();
		chapter.setViewChapter(chapter.getViewChapter() + 1);
		chapterRepository.save(chapter);
		return chapter.getViewChapter();
	}

	/**
	 * Cập nhật thông tin của một chương. Nếu có file văn bản (.txt) mới được tải
	 * lên, nội dung chương sẽ được cập nhật lại.
	 *
	 * @param request  thông tin yêu cầu cập nhật chương
	 * @param textFile file văn bản (.txt) mới (nếu có)
	 * @return chương sau khi được cập nhật dưới dạng ChapterRespone
	 * @throws IOException nếu xảy ra lỗi khi đọc file
	 */
	public ChapterRespone updateChapter(ChapterUpdateRequest request, MultipartFile textFile) throws IOException {
		try {

			List<Chapter> chapters = chapterRepository.findByTitleChapter(request.getTitleChapter()).get();
			boolean isDuplicate = chapters.stream()
					.filter(chapter -> chapter.getNovel().getIdNovel().equals(request.getNovel()) && !chapter.getIdChapter().equals(request.getIdChapter())).findAny()
					.isPresent();

			if (isDuplicate) {
				throw new AppException(ErrorCode.CHAPTER_EXISTSED);
			}

			
		
			
			
			logger.info("Bắt đầu updateChapter với idChapter = {}", request.getIdChapter());

			// Bước 1: Tìm chapter gốc
			Chapter chapterOgirin = chapterRepository.findById(request.getIdChapter()).orElseThrow(() -> {
				logger.warn("Không tìm thấy chapter với id = {}", request.getIdChapter());
				return new AppException(ErrorCode.CHAPTER_NOT_EXISTED);
			});
			logger.info("Đã tìm thấy chapter gốc: {}", chapterOgirin.getIdChapter());

			Category category = categoryRepository.findByNameCategory("Truyện Convert");
			Category category2 = categoryRepository.findByNameCategory("Truyện Dịch");

			if (chapterOgirin.getNovel().getCategories()!=null && !chapterOgirin.getNovel().getCategories().isEmpty() ) {
				if (chapterOgirin.getNovel().getCategories().contains(category) && chapterOgirin.getCoinPrice()!=null) {
						throw new AppException(ErrorCode.NOVEL_CONVERT_CANNOT_HAVE_PRICE);
				}
				if (!chapterOgirin.getNovel().getCategories().contains(category2)&& chapterOgirin.getCoinPrice()!=null) {
					throw new AppException(ErrorCode.NOVEL_CONVERT_CANNOT_HAVE_PRICE);
				}
			}
			
			// Bước 2: Map thông tin update vào entity
			chapterMapper.updateChapter(request, chapterOgirin);
			logger.info("Đã cập nhật thông tin từ request vào chapter");

			// Bước 3: Tìm novel
			Novel novel = novelRepository.findById(request.getNovel()).orElseThrow(() -> {
				logger.warn("Không tìm thấy novel với id = {}", request.getNovel());
				return new AppException(ErrorCode.NOVEL_NOT_EXISTED);
			});
			logger.info("Đã tìm thấy novel: {}", novel.getIdNovel());

			// Bước 4: Kiểm tra chapter có thuộc novel không
			if (!novel.getIdNovel().equals(chapterOgirin.getNovel().getIdNovel())) {
				logger.warn("Novel không chứa chapter này: novelId={}, chapterNovelId={}", novel.getIdNovel(),
						chapterOgirin.getNovel().getIdNovel());
				throw new AppException(ErrorCode.NOVEL_NOT_CONTAIN_CHAPTER);
			}
			logger.info("Novel chứa chapter hợp lệ");

			// Bước 5: Nếu indexChapter chưa có thì gán index mới
			if (chapterOgirin.getIndexChapter() == null) {
				Long lastChapterNumber = chapterRepository.findTopByNovelOrderByIndexChapterDesc(novel)
						.map(Chapter::getIndexChapter).orElse(0L);
				chapterOgirin.setIndexChapter(lastChapterNumber + 1);
				logger.info("Gán indexChapter mới: {}", chapterOgirin.getIndexChapter());
			}

			// Bước 6: Kiểm tra file txt
			Boolean isHaveFile = false;
			if (textFile != null && !textFile.isEmpty()) {
				logger.info("File được gửi lên: {}", textFile.getOriginalFilename());

				String originalFilename = textFile.getOriginalFilename();
				if (originalFilename != null && originalFilename.toLowerCase().endsWith(".txt")) {
					String cotent = new String(textFile.getBytes(), StandardCharsets.UTF_8);
					isHaveFile = true;
					chapterOgirin.setContentChapter(cotent);
					logger.info("Nội dung chương đã được cập nhật từ file .txt");
				} else {
					logger.warn("File không đúng định dạng .txt");
					throw new AppException(ErrorCode.FILE_MUST_TXT);
				}
			}

			// Bước 7: Lưu chapter
			chapterOgirin = chapterRepository.save(chapterOgirin);
			logger.info("Đã lưu chapter thành công: {}", chapterOgirin.getIdChapter());

			// Bước 8: Nếu có file thì cập nhật job TTS
			if (isHaveFile) {
//				logger.info("Đang xử lý TTS job cho chapterId = {}", chapterOgirin.getIdChapter());
//				
//				TtsJob ttsJob = ttsJobRepository.findByIdChapter(chapterOgirin.getIdChapter())
//				        .orElseThrow(() -> new AppException(ErrorCode.TTJOB_NOT_FOUND));
//
//				// Load full subJobs để Hibernate biết cần xóa gì
//				ttsJob.getSubJobs().size(); // force lazy loading
//
//				logger.info("ID của TtsJob là: {}", ttsJob.getId());
//
//				try {
//				    ttsJobRepository.delete(ttsJob);  // <-- Ưu tiên dùng delete(entity) thay vì deleteById()
//				} catch (Exception e) {
//				    logger.error("Lỗi khi xóa TtsJob", e);
//				    throw new AppException(ErrorCode.TTJOB_NOT_FOUND);
//				}

				ttsJobAsyncService.speakLongTextAsync(chapterOgirin.getContentChapter(), chapterOgirin.getIdChapter());
				logger.info("TTS job đã được cập nhật lại");
			}

			// Bước 9: Gửi thông báo cho follower
			List<FollowNovel> followNovels = followNovelRepository
					.findByNovel_IdNovel(chapterOgirin.getNovel().getIdNovel());
			logger.info("Có {} follower sẽ nhận thông báo", followNovels.size());

			for (FollowNovel followNovel : followNovels) {
				try {
					HistoryNotityCreationRequest historyNotityCreationRequest = HistoryNotityCreationRequest.builder()
							.user(followNovel.getUser()).nameNovel(followNovel.getNovel().getNameNovel())
							.titleChapter(chapterOgirin.getTitleChapter()).build();
					createHistoryNotify(historyNotityCreationRequest);
					logger.info("Đã gửi thông báo tới user: {}", followNovel.getUser().getIdUser());
				} catch (Exception e) {
					logger.warn("Lỗi khi gửi thông báo tới follower: {}", followNovel.getUser().getIdUser());
//					e.printStackTrace();
				}
			}

			logger.info("Hoàn tất updateChapter");
			return chapterMapper.toChapterRespone(chapterOgirin);

		} catch (Exception e) {
			logger.error("update chapter> try catch final - Lỗi xảy ra: {}", e.getMessage());
//			e.printStackTrace();
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

	/**
	 * Tạo thông báo lịch sử cho người dùng khi có chương mới.
	 *
	 * @param request thông tin để tạo thông báo (gồm user, tên truyện, tiêu đề
	 *                chương)
	 * @return true nếu tạo thành công, false nếu có lỗi xảy ra
	 */
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
