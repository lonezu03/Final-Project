package com.example.demo.service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.CategoryCreationRequest;
import com.example.demo.dto.request.CategoryUpdateRequest;
import com.example.demo.dto.respone.CategoryRespone;
import com.example.demo.entity.Category;
import com.example.demo.entity.Novel;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.ICategoryMapper;
import com.example.demo.repository.ICategoryRepository;
import com.example.demo.repository.INovelRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CategoryService {

	ICategoryMapper categoryMapper;
	ICategoryRepository categoryRepository;
	INovelRepository novelRepository;
/**
 * Lấy danh sách tất cả thể loại có trong hệ thống.
 *
 * @return danh sách thể loại dưới dạng CategoryRespone
 */
	public List<CategoryRespone> getAllCategory() {
		return categoryRepository.findAll().stream().map(t -> categoryMapper.toCategoryRespone(t)).toList();
	}
/**
 * Tạo mới một thể loại.
 * Kiểm tra nếu tên thể loại đã tồn tại thì báo lỗi.
 *
 * @param request thông tin yêu cầu tạo thể loại
 * @return thể loại vừa được tạo dưới dạng CategoryRespone
 * @throws AppException nếu tên thể loại đã tồn tại
 */
	public CategoryRespone createCategory(CategoryCreationRequest request) {
		if (categoryRepository.existsByNameCategory(request.getNameCategory())) {
			throw new AppException(ErrorCode.CATEGORY_ALREADY_IN);
		}
		Category category = categoryMapper.toCategory(request);

		category = categoryRepository.save(category);

		return categoryMapper.toCategoryRespone(category);
	}
/**
 * Xoá một thể loại theo ID.
 * Đồng thời xoá liên kết giữa thể loại và các truyện có liên quan trước khi xoá thể loại.
 *
 * @param idCategory ID của thể loại cần xoá
 * @return ID của thể loại đã xoá
 * @throws AppException nếu thể loại không tồn tại hoặc có ràng buộc không thể xoá
 */
	public String deleteCategory(String idCategory) {
		Category category = categoryRepository.findById(idCategory)
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));


		for (Novel novel : new HashSet<>(category.getNovels())) {
            novel.getCategories().remove(category); // xóa Author khỏi Novel (bên sở hữu)
        }
		category.getNovels().clear();
		
		try {
			categoryRepository.deleteById(idCategory);

		} catch (Exception e) {
			e.printStackTrace();
			throw new AppException(ErrorCode.DELETE_CONTRAINT);
		}
		return idCategory;
	}
/**
 * Cập nhật thông tin của một thể loại.
 *
 * @param request thông tin yêu cầu cập nhật thể loại
 * @return thể loại sau khi được cập nhật dưới dạng CategoryRespone
 * @throws AppException nếu thể loại không tồn tại
 */
	public CategoryRespone updateCategory(CategoryUpdateRequest request) {
		Category category = categoryMapper.toCategoryUpdate(request);
		if (!categoryRepository.existsById(request.getIdCategory())) {
			throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
		}
//		Set<Novel> novels = new HashSet<>(novelRepository.findAllById(request.getNovels()));
		category = categoryRepository.save(category);

//		for (Novel novel : novels) {
//			novel.getCategories().add(category);
//			novelRepository.save(novel);
//		}

		return categoryMapper.toCategoryRespone(category);
	}
}
