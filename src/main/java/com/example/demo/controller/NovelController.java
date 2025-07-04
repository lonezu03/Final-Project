package com.example.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.FollowNovelRequest;
import com.example.demo.dto.request.NovelAddAuthorRequest;
import com.example.demo.dto.request.NovelAddCategoryRequest;
import com.example.demo.dto.request.NovelCreatationRequest;
import com.example.demo.dto.request.NovelRemoveAuthorRequest;
import com.example.demo.dto.request.NovelRemoveCategoryRequest;
import com.example.demo.dto.request.NovelSearchCriteriaRequest;
import com.example.demo.dto.request.NovelUpdateRequest;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.NovelRespone;
import com.example.demo.service.FollowNovelService;
import com.example.demo.service.NovelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/novel")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Tag(name = "Novel Controller", description = "API quản lý tiểu thuyết: tạo, cập nhật, xoá, và xử lý 1 chút xíu tác giả & thể loại")
public class NovelController {

	NovelService novelService;
	FollowNovelService followNovelService;
	/**
 * API lấy toàn bộ tiểu thuyết có trong hệ thống.
 *
 * @return Danh sách tất cả tiểu thuyết dưới dạng ApiRespone
 */
	@GetMapping("/getAll")
	@Operation(summary = "Lấy toàn bộ novel", description = "Thì có vậy hoi á lấy toàn bộ Novel")
	public ApiRespone<List<NovelRespone>> getAll() {
		return ApiRespone.<List<NovelRespone>>builder().result(novelService.getAll()).build();
	}
/**
 * API tìm kiếm tiểu thuyết theo các tiêu chí cụ thể.
 *
 * @param criteria Điều kiện tìm kiếm (theo tên, thể loại, tác giả,...)
 * @param pageable Phân trang
 * @return Trang kết quả các tiểu thuyết phù hợp
 */
	@PostMapping("/search")
	@Operation(summary = "Lấy novel theo điều kiện truyền vào", description = "Thì có vậy hoi á truyền điều kiện lấy Novel")
    public ResponseEntity<Page<NovelRespone>> searchNovels(
            @RequestBody NovelSearchCriteriaRequest criteria,
            Pageable pageable) {
        
        Page<NovelRespone> results = novelService.searchNovels(criteria, pageable);
        return ResponseEntity.ok(results);
    }
	/**
 * API lấy chi tiết một tiểu thuyết theo ID.
 *
 * @param idNovel ID của tiểu thuyết cần lấy
 * @return Dữ liệu chi tiết của tiểu thuyết
 */
	@GetMapping(value = "/{idNovel}")
	@Operation(summary = "Lấy thông tin chi tiết tiểu thuyết", description = "Lấy dữ liệu của một tiểu thuyết dựa theo ID.")
	public ApiRespone<NovelRespone> getNovelRespone(@PathVariable String idNovel) {
		return ApiRespone.<NovelRespone>builder().result(novelService.getNovel(idNovel)).build();
	}
/**
 * API tạo mới một tiểu thuyết, có thể kèm ảnh bìa.
 *
 * @param request Thông tin tiểu thuyết cần tạo
 * @param image Ảnh bìa (tuỳ chọn)
 * @return Tiểu thuyết sau khi được tạo
 */
	@PostMapping(value = "/create", consumes = { "multipart/form-data" })
	@Operation(summary = "Tạo mới tiểu thuyết", description = "Tạo một tiểu thuyết mới, có thể kèm theo ảnh bìa (image).")
	public ApiRespone<NovelRespone> createNovel(@RequestPart NovelCreatationRequest request,
			@RequestParam(required = false) MultipartFile image) throws IOException {
		return ApiRespone.<NovelRespone>builder().result(novelService.createNovel(request, image)).build();
	}
/**
 * API cập nhật thông tin một tiểu thuyết, có thể kèm ảnh bìa mới.
 *
 * @param request Thông tin cập nhật
 * @param image Ảnh bìa mới (tuỳ chọn)
 * @return Tiểu thuyết sau khi được cập nhật
 */
	@PutMapping(value = "/update", consumes = { "multipart/form-data" })
	@Operation(summary = "Cập nhật thông tin tiểu thuyết", description = "Cập nhật thông tin của một tiểu thuyết, có thể kèm theo ảnh bìa mới.")
	public ApiRespone<NovelRespone> updateNovel(@RequestPart NovelUpdateRequest request,
			@RequestParam(required = false) MultipartFile image) throws IOException {
		return ApiRespone.<NovelRespone>builder().result(novelService.updateNovel(request, image)).build();
	}
/**
 * API xoá một tiểu thuyết theo ID.
 *
 * @param idNovel ID của tiểu thuyết cần xoá
 * @return ID của tiểu thuyết đã xoá
 */
	@DeleteMapping(value = "/{idNovel}")
	@Operation(summary = "Xoá tiểu thuyết", description = "Xoá một tiểu thuyết dựa theo ID.")
	public ApiRespone<String> deleteNovel(@PathVariable String idNovel) {
		return ApiRespone.<String>builder().result(novelService.deleteById(idNovel)).build();
	}
/**
 * API thêm tác giả vào tiểu thuyết.
 *
 * @param request Thông tin bao gồm ID truyện và ID tác giả cần thêm
 * @return Tiểu thuyết sau khi thêm tác giả
 */
	@PostMapping("/addAuthor")
	@Operation(summary = "Thêm tác giả vào tiểu thuyết", description = "Thêm một tác giả vào danh sách tác giả của tiểu thuyết.")
	public ApiRespone<NovelRespone> addAuthor(@RequestBody NovelAddAuthorRequest request) {
		return ApiRespone.<NovelRespone>builder().result(novelService.addAuthor(request)).build();
	}
/**
 * API xoá tác giả khỏi tiểu thuyết.
 *
 * @param request Thông tin bao gồm ID truyện và ID tác giả cần xoá
 * @return Tiểu thuyết sau khi xoá tác giả
 */
	@PostMapping("/removeAuthor")
	@Operation(summary = "Xoá tác giả khỏi tiểu thuyết", description = "Xoá một tác giả khỏi danh sách tác giả của tiểu thuyết.")
	public ApiRespone<NovelRespone> removeAuthor(@RequestBody NovelRemoveAuthorRequest request) {
		return ApiRespone.<NovelRespone>builder().result(novelService.removeAuthor(request)).build();
	}
/**
 * API thêm thể loại vào tiểu thuyết.
 *
 * @param request Thông tin bao gồm ID truyện và ID thể loại cần thêm
 * @return Tiểu thuyết sau khi thêm thể loại
 */
	@PostMapping("/addCategory")
	@Operation(summary = "Thêm thể loại vào tiểu thuyết", description = "Thêm một thể loại vào danh sách thể loại của tiểu thuyết.")
	public ApiRespone<NovelRespone> addCategory(@RequestBody NovelAddCategoryRequest request) {
		return ApiRespone.<NovelRespone>builder().result(novelService.addCategory(request)).build();
	}
/**
 * API xoá thể loại khỏi tiểu thuyết.
 *
 * @param request Thông tin bao gồm ID truyện và ID thể loại cần xoá
 * @return Tiểu thuyết sau khi xoá thể loại
 */
	@PostMapping("/removeCategory")
	@Operation(summary = "Xoá thể loại khỏi tiểu thuyết", description = "Xoá một thể loại khỏi danh sách thể loại của tiểu thuyết.")
	public ApiRespone<NovelRespone> removeCategory(@RequestBody NovelRemoveCategoryRequest request) {
		return ApiRespone.<NovelRespone>builder().result(novelService.removeCategory(request)).build();
	}
	/**
 * API để người dùng theo dõi một tiểu thuyết.
 *
 * @param request Bao gồm ID truyện và ID người dùng
 * @return Trạng thái theo dõi thành công hay không
 */
	@PostMapping("/followNovel")
	@Operation(summary = "Follow truyện", description = "User bấm theo dõi 1 truyện.")
	public ApiRespone<Boolean> followNovel(@RequestBody FollowNovelRequest request){
		try {
			followNovelService.followNovel(request);
			return ApiRespone.<Boolean>builder().result(true).build();

		} catch (Exception e) {
			e.printStackTrace();
			return ApiRespone.<Boolean>builder().result(false).build();
		}
	}
}
