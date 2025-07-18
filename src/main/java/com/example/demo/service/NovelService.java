package com.example.demo.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.FollowNovelRequest;
import com.example.demo.dto.request.NovelAddAuthorRequest;
import com.example.demo.dto.request.NovelAddCategoryRequest;
import com.example.demo.dto.request.NovelCreatationRequest;
import com.example.demo.dto.request.NovelRemoveAuthorRequest;
import com.example.demo.dto.request.NovelRemoveCategoryRequest;
import com.example.demo.dto.request.NovelSearchCriteriaRequest;
import com.example.demo.dto.request.NovelUpdateRequest;
import com.example.demo.dto.respone.NovelRespone;
import com.example.demo.dto.respone.UploadFileRespone;
import com.example.demo.entity.Author;
import com.example.demo.entity.Category;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.FollowNovelId;
import com.example.demo.entity.HistoryNotify;
import com.example.demo.entity.Novel;
import com.example.demo.entity.User;
import com.example.demo.enums.StringOperator;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.INovelMapper;
import com.example.demo.repository.IAuthorRepository;
import com.example.demo.repository.ICategoryRepository;
import com.example.demo.repository.IFollowNovelRepository;
import com.example.demo.repository.IHistoryNotifyRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IReviewNovelRepository;
import com.example.demo.repository.IUserRepository;
import com.example.demo.specification.NovelSpecification;
import com.example.demo.util.NovelRatingProjection;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NovelService {
	INovelRepository novelRepository;
	INovelMapper novelMapper;
	IUserRepository userRepository;
	IAuthorRepository authorRepository;
	UploadFileService uploadFileService;
	ICategoryRepository categoryRepository;
	IFollowNovelRepository followNovelRepository;
	IHistoryNotifyRepository historyNotifyRepository;
	IReviewNovelRepository reviewNovelRepository;
	static Logger logger = LoggerFactory.getLogger(NovelService.class);

	/**
	 * Lấy tất cả truyện từ cơ sở dữ liệu.
	 *
	 * @return Danh sách các đối tượng NovelRespone
	 */
	public List<NovelRespone> getAll() {
		List<NovelRatingProjection> avgRatings = reviewNovelRepository.findAverageRatingForAllNovels();
		Map<String, Double> ratingMap = avgRatings.stream()
				.collect(Collectors.toMap(NovelRatingProjection::getIdNovel, NovelRatingProjection::getAvgRating));

		return novelRepository.findAllWithoutDeleted().stream().map(novel -> {
			NovelRespone novelRespone = novelMapper.toNovelRespone(novel);
			Double avg = ratingMap.get(novel.getIdNovel());
			novelRespone.setRating(avg != null ? String.format("%.1f", avg) : "0");
			Integer totalFollow = followNovelRepository.findByNovel_IdNovel(novel.getIdNovel()).size();
			novelRespone.setTotalFollower(totalFollow);

			int totalView = novel.getChapters().stream().mapToInt(Chapter::getViewChapter).sum();
			novelRespone.setTotalView(totalView);

			return novelRespone;
		}).toList();

	}

	/**
	 * Lấy thông tin truyện theo ID.
	 *
	 * @param idNovel ID của truyện cần lấy
	 * @return Đối tượng NovelRespone tương ứng
	 */
	public NovelRespone getNovel(String idNovel) {
		Novel novel = novelRepository.findById(idNovel).orElseThrow(() -> new RuntimeException("Novel not found"));

		Integer totalFollow = followNovelRepository.findByNovel_IdNovel(idNovel).size();
		NovelRespone respone = novelMapper.toNovelRespone(novel);
		respone.setTotalFollower(totalFollow);

		int totalView = novel.getChapters().stream().mapToInt(Chapter::getViewChapter).sum();
		respone.setTotalView(totalView);

		// Gọi query lấy rating trung bình
		Double avg = reviewNovelRepository.findAverageRatingByNovelId(idNovel);
		respone.setRating(avg != null ? String.format("%.1f", avg) : "0");

		return respone;

	}

	/**
	 * Tạo mới một truyện và (nếu có) upload ảnh đại diện.
	 *
	 * @param request Thông tin truyện cần tạo
	 * @param file    File ảnh đại diện (tùy chọn)
	 * @return Đối tượng NovelRespone sau khi tạo thành công
	 * @throws IOException Nếu xảy ra lỗi trong quá trình upload ảnh
	 */
	public NovelRespone createNovel(NovelCreatationRequest request, MultipartFile file) throws IOException {
		Novel novel = novelMapper.toNovel(request);
		novel.setAuthors(new HashSet<>());
		novel.setCategories(new HashSet<>());

		if (request.getAuthors()!=null && !request.getAuthors().isEmpty()) {
			List<Author> authors = authorRepository.findAllById(request.getAuthors());
			for (Author author : authors) {
				novel.getAuthors().add(author);
			}

		}
		
		if (request.getCategory()!=null && !request.getCategory().isEmpty()) {
			List<Category> categories = categoryRepository.findAllById(request.getCategory());
			for (Category category : categories) {
				novel.getCategories().add(category);
			}
		}
		
		
		
		if (file != null && !file.isEmpty()) {
			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);
			novel.setImageNovel(uploadFileRespone.getUrl());
			novel.setPublicIDNovel(uploadFileRespone.getPublic_id());
		}

		return novelMapper.toNovelRespone(novelRepository.save(novel));
//		return novelMapper.toNovelRespone(novel);
 
	}

	/**
	 * Cập nhật thông tin truyện và (nếu có) cập nhật ảnh đại diện.
	 *
	 * @param request Thông tin truyện cần cập nhật
	 * @param file    File ảnh đại diện mới (tùy chọn)
	 * @return Đối tượng NovelRespone sau khi cập nhật thành công
	 * @throws IOException Nếu có lỗi khi upload hoặc xóa ảnh
	 */
	public NovelRespone updateNovel(NovelUpdateRequest request, MultipartFile file) throws IOException {

		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));

		novelMapper.updateNovel(request, novel);
		
		novel.setAuthors(new HashSet<>());
		novel.setCategories(new HashSet<>());
		
		if (request.getAuthors()!=null && !request.getAuthors().isEmpty()) {
			List<Author> authors = authorRepository.findAllById(request.getAuthors());
			for (Author author : authors) {
				novel.getAuthors().add(author);
			}

		}
		
		if (request.getCategory()!=null && !request.getCategory().isEmpty()) {
			List<Category> categories = categoryRepository.findAllById(request.getCategory());
			for (Category category : categories) {
				novel.getCategories().add(category);
			}
		}
		
		if (file != null && !file.isEmpty()) {

			if (novel.getPublicIDNovel() != null && !novel.getPublicIDNovel().isEmpty()) {
				uploadFileService.deleteImage(novel.getPublicIDNovel());
			}

			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);
			novel.setImageNovel(uploadFileRespone.getUrl());
			novel.setPublicIDNovel(uploadFileRespone.getPublic_id());
		}

		return novelMapper.toNovelRespone(novelRepository.save(novel));
//		return novelMapper.toNovelRespone(novel);
	}

	/**
	 * Xóa một truyện theo ID, bao gồm cả ảnh nếu có.
	 *
	 * @param idNovel ID của truyện cần xóa
	 * @return ID của truyện đã bị xóa
	 * @throws AppException Nếu vi phạm ràng buộc (constraint) khóa ngoại
	 */
	public String deleteById(String idNovel) {
		try {
//			Novel novel = novelRepository.findById(idNovel).get();
//			if (!novel.getPublicIDNovel().isEmpty()) {
//				uploadFileService.deleteImage(novel.getPublicIDNovel());
//
//			}
//			novelRepository.deleteById(idNovel);

			Novel novel = novelRepository.findById(idNovel)
					.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));

			novel.setDelete_at(LocalDateTime.now());
			novel = novelRepository.save(novel);
			return novel.getIdNovel();
		} catch (Exception e) {
			throw new AppException(ErrorCode.DELETE_CONTRAINT);
		}

	}

	/**
	 * Xóa một tác giả khỏi truyện.
	 *
	 * @param request Yêu cầu chứa ID truyện và ID tác giả cần xóa
	 * @return Đối tượng NovelRespone sau khi cập nhật
	 */
	public NovelRespone removeAuthor(NovelRemoveAuthorRequest request) {
		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));
		Author author = authorRepository.findById(request.getIdAuthor())
				.orElseThrow(() -> new AppException(ErrorCode.AUTHOR_NOT_EXISTED));

		if (novel.getAuthors().remove(author)) {
			novelRepository.save(novel);
		}

		return novelMapper.toNovelRespone(novel);
	}

	/**
	 * Thêm một tác giả vào truyện.
	 *
	 * @param request Yêu cầu chứa ID truyện và ID tác giả cần thêm
	 * @return Đối tượng NovelRespone sau khi cập nhật
	 */
	public NovelRespone addAuthor(NovelAddAuthorRequest request) {
		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));
		Author author = authorRepository.findById(request.getIdAuthor())
				.orElseThrow(() -> new AppException(ErrorCode.AUTHOR_NOT_EXISTED));

		if (novel.getAuthors().add(author)) {
			novelRepository.save(novel);
		}

		return novelMapper.toNovelRespone(novel);
	}

	/**
	 * Xóa một thể loại khỏi truyện.
	 *
	 * @param request Yêu cầu chứa ID truyện và ID thể loại cần xóa
	 * @return Đối tượng NovelRespone sau khi cập nhật
	 */
	public NovelRespone removeCategory(NovelRemoveCategoryRequest request) {
		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));
		Category category = categoryRepository.findById(request.getIdCategory())
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

		if (novel.getCategories().remove(category)) {
			novelRepository.save(novel);
		}

		if (category.getNovels().remove(novel)) {
			categoryRepository.save(category);
		}

		return novelMapper.toNovelRespone(novel);
	}

	/**
	 * Thêm một thể loại vào truyện.
	 *
	 * @param request Yêu cầu chứa ID truyện và ID thể loại cần thêm
	 * @return Đối tượng NovelRespone sau khi cập nhật
	 */
	public NovelRespone addCategory(NovelAddCategoryRequest request) {
		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));
		Category category = categoryRepository.findById(request.getIdCategory())
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

		if (novel.getCategories().add(category)) {
			novelRepository.save(novel);
		}

		return novelMapper.toNovelRespone(novel);
	}

	/**
	 * Tìm kiếm truyện dựa trên nhiều tiêu chí: tên, rating, số chương, trạng thái,
	 * tên tác giả, tên thể loại,... và có phân trang.
	 *
	 * @param criteria Tiêu chí tìm kiếm
	 * @param pageable Thông tin phân trang
	 * @return Trang chứa các truyện phù hợp dạng NovelRespone
	 */
	@Transactional(readOnly = true) // Dùng readOnly để tối ưu hóa hiệu năng cho các truy vấn đọc
	public Page<NovelRespone> searchNovels(NovelSearchCriteriaRequest criteria, Pageable pageable) {
		// Bắt đầu với một Specification không có điều kiện (luôn đúng)
		Specification<Novel> spec = Specification.where(null);

		// 1. Lọc theo tên truyện
		if (criteria.getNameNovel() != null && !criteria.getNameNovel().isEmpty()) {
			if (criteria.getNameOperator() == StringOperator.EQUALS) {
				spec = spec.and(NovelSpecification.hasName(criteria.getNameNovel()));
			} else {
				// Mặc định là tìm kiếm tương đối (CONTAINS)
				spec = spec.and(NovelSpecification.hasSimilarName(criteria.getNameNovel()));
			}
		}

		// (Bạn có thể thêm logic tương tự cho descriptionNovel ở đây nếu cần)

		// 4. Lọc theo danh sách trạng thái (statuses)
		if (criteria.getStatuses() != null && !criteria.getStatuses().isEmpty()) {
			spec = spec.and(NovelSpecification.hasStatusIn(criteria.getStatuses()));
		}

		// 5. Lọc theo danh sách tên tác giả
		if (criteria.getAuthorNames() != null && !criteria.getAuthorNames().isEmpty()) {
			spec = spec.and(NovelSpecification.byAuthorNames(criteria.getAuthorNames()));
		}

		spec = spec.and(NovelSpecification.filterDeleted(criteria.getIsDelete()));

		// 6. Lọc theo danh sách tên thể loại
		if (criteria.getCategoryNames() != null && !criteria.getCategoryNames().isEmpty()) {
			spec = spec.and(NovelSpecification.byCategoryNames(criteria.getCategoryNames()));
		}

		// Thực thi truy vấn với Specification đã được xây dựng và có phân trang
		// Nhờ có @EntityGraph trong Repository, câu lệnh này sẽ được tối ưu để tránh
		// N+1
		Page<Novel> novelsPage = novelRepository.findAll(spec, pageable);

		Set<String> followedNovelIds;

		if (StringUtils.hasText(criteria.getIdUser())) {
			List<FollowNovel> followNovels = followNovelRepository.findByUserIdUser(criteria.getIdUser());
			final Set<String> ids = followNovels.stream().map(f -> f.getNovel().getIdNovel())
					.collect(Collectors.toSet());
			followedNovelIds = ids;
		} else {
			followedNovelIds = Collections.emptySet();
		}

		// Chuyển đổi từ Page<Novel> sang Page<NovelDTO> để trả về cho client
		novelsPage.map(novel -> {
			Integer finalTotalFollower = followNovelRepository.findByNovel_IdNovel(novel.getIdNovel()).size();

			NovelRespone novelRespone = novelMapper.toNovelRespone(novel);
			boolean isFollow = followedNovelIds.contains(novel.getIdNovel());
			novelRespone.setIsFollow(isFollow);
			novelRespone.setTotalFollower(finalTotalFollower);
			return novelRespone;
		});

		// Lấy danh sách idNovel trong trang hiện tại
		List<String> novelIdsInPage = novelsPage.getContent().stream().map(Novel::getIdNovel)
				.collect(Collectors.toList());

		// Lấy rating trung bình theo các novel trong trang này
		Map<String, Double> ratingMap = reviewNovelRepository.findAverageRatingByNovelIds(novelIdsInPage).stream()
				.collect(Collectors.toMap(NovelRatingProjection::getIdNovel, NovelRatingProjection::getAvgRating));
		return novelsPage.map(novel -> {
			Integer finalTotalFollower = followNovelRepository.findByNovel_IdNovel(novel.getIdNovel()).size();

			NovelRespone novelRespone = novelMapper.toNovelRespone(novel);

			// Gán rating trung bình
			Double avgRating = ratingMap.get(novel.getIdNovel());
			novelRespone.setRating(avgRating != null ? String.format("%.1f", avgRating) : "0");

			// Gán follow và follower
			boolean isFollow = followedNovelIds.contains(novel.getIdNovel());
			novelRespone.setIsFollow(isFollow);
			novelRespone.setTotalFollower(finalTotalFollower);

			return novelRespone;
		});

	}

	/**
	 * Lấy danh sách tất cả các truyện mà người dùng đã follow.
	 *
	 * @return Danh sách các đối tượng FollowNovel
	 */
	public List<FollowNovel> getAllFollowNovel() {
		logger.info("Gọi danh sách follow novel");
		return followNovelRepository.findAll();
	}

	/**
	 * Lấy toàn bộ lịch sử thông báo.
	 *
	 * @return Danh sách các đối tượng HistoryNotify
	 */

	public List<HistoryNotify> getAllHistoryNotify() {
		return historyNotifyRepository.findAll();
	}

}
