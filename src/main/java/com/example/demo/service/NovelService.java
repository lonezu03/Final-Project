package com.example.demo.service;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
import com.example.demo.entity.Novel;
import com.example.demo.enums.StringOperator;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.INovelMapper;
import com.example.demo.repository.IAuthorRepository;
import com.example.demo.repository.ICategoryRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.specification.NovelSpecification;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NovelService {
	INovelRepository novelRepository;
	INovelMapper novelMapper;
	IAuthorRepository authorRepository;
	UploadFileService uploadFileService;
	ICategoryRepository categoryRepository;

	public List<NovelRespone> getAll() {
		return novelRepository.findAll().stream().map(t -> novelMapper.toNovelRespone(t)).toList();
	}

	public NovelRespone getNovel(String idNovel) {
		return novelMapper.toNovelRespone(novelRepository.findById(idNovel).get());
	}

	public NovelRespone createNovel(NovelCreatationRequest request, MultipartFile file) throws IOException {
		Novel novel = novelMapper.toNovel(request);
	
		if (file != null && !file.isEmpty()) {
			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);
			novel.setImageNovel(uploadFileRespone.getUrl());
			novel.setPublicIDNovel(uploadFileRespone.getPublic_id());
		}


		return novelMapper.toNovelRespone(novelRepository.save(novel));
	}

	public NovelRespone updateNovel(NovelUpdateRequest request, MultipartFile file) throws IOException {

		Novel novel = novelMapper.toNovelUpdate(request);

		

		if (file != null && !file.isEmpty()) {

			if (novel.getPublicIDNovel() != null && !novel.getPublicIDNovel().isEmpty()) {
				uploadFileService.deleteImage(novel.getPublicIDNovel());
			}

			UploadFileRespone uploadFileRespone = uploadFileService.uploadFile(file);
			novel.setImageNovel(uploadFileRespone.getUrl());
			novel.setPublicIDNovel(uploadFileRespone.getPublic_id());
		}

		return novelMapper.toNovelRespone(novelRepository.save(novel));
	}

	public String deleteById(String idNovel) {
		try {
			Novel novel = novelRepository.findById(idNovel).get();
			if (!novel.getPublicIDNovel().isEmpty()) {
				uploadFileService.deleteImage(novel.getPublicIDNovel());

			}
			novelRepository.deleteById(idNovel);
			return idNovel;
		} catch (Exception e) {
			throw new AppException(ErrorCode.DELETE_CONTRAINT);
		}

	}

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

	        // 2. Lọc theo rating
	        if (criteria.getRatingGreaterThanOrEqual() != null) {
	            spec = spec.and(NovelSpecification.ratingGreaterThanOrEqual(criteria.getRatingGreaterThanOrEqual()));
	        }

	        // 3. Lọc theo tổng số chương
	        if (criteria.getTotalChapterGreaterThan() != null) {
	            spec = spec.and(NovelSpecification.totalChapterGreaterThan(criteria.getTotalChapterGreaterThan()));
	        }
	        if (criteria.getTotalChapterLessThan() != null) {
	            spec = spec.and(NovelSpecification.totalChapterLessThan(criteria.getTotalChapterLessThan()));
	        }

	        // 4. Lọc theo danh sách trạng thái (statuses)
	        if (criteria.getStatuses() != null && !criteria.getStatuses().isEmpty()) {
	            spec = spec.and(NovelSpecification.hasStatusIn(criteria.getStatuses()));
	        }
	        
	        // 5. Lọc theo danh sách tên tác giả
	        if (criteria.getAuthorNames() != null && !criteria.getAuthorNames().isEmpty()) {
	            spec = spec.and(NovelSpecification.byAuthorNames(criteria.getAuthorNames()));
	        }

	        // 6. Lọc theo danh sách tên thể loại
	        if (criteria.getCategoryNames() != null && !criteria.getCategoryNames().isEmpty()) {
	            spec = spec.and(NovelSpecification.byCategoryNames(criteria.getCategoryNames()));
	        }

	        // Thực thi truy vấn với Specification đã được xây dựng và có phân trang
	        // Nhờ có @EntityGraph trong Repository, câu lệnh này sẽ được tối ưu để tránh N+1
	        Page<Novel> novelsPage = novelRepository.findAll(spec, pageable);
	        
	        // Chuyển đổi từ Page<Novel> sang Page<NovelDTO> để trả về cho client
	        return novelsPage.map(novel -> novelMapper.toNovelRespone(novel));
	    }
}
