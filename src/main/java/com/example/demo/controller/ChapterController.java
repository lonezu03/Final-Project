package com.example.demo.controller;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;
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

import com.example.demo.dto.request.ChapterCreationRequest;
import com.example.demo.dto.request.ChapterGetByIdNovelRequest;
import com.example.demo.dto.request.ChapterUpdateRequest;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.ChapterRespone;
import com.example.demo.service.ChapterService;
import com.nimbusds.jose.JOSEException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/chapter")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Tag(name = "Chapter Controller", description = "API quản lý chương truyện: tạo, cập nhật, xoá, xem chi tiết và tăng lượt xem")
public class ChapterController { 

	ChapterService chapterService;

/** 
 * API lấy danh sách tất cả chương của một truyện cụ thể theo ID truyện.
 *
 * @param request thông tin truyện cần lấy chương (bao gồm ID và token nếu có)
 * @return danh sách các chương thuộc truyện đó, bọc trong ApiRespone
 * @throws JOSEException nếu xảy ra lỗi xác thực token
 * @throws ParseException nếu token không phân tích được
 */
	@PostMapping("/getAll")
	@Operation(summary = "Lấy danh sách chương theo truyện", description = "Trả về danh sách tất cả các chương thuộc truyện có ID tương ứng.")
	public ApiRespone<List<ChapterRespone>> getAll(@RequestBody ChapterGetByIdNovelRequest request) throws JOSEException, ParseException {
		return ApiRespone.<List<ChapterRespone>>builder().result(chapterService.getAllChapter(request)).build();
	}
/**
 * API lấy chi tiết nội dung của một chương theo ID chương.
 *
 * @param idChapter ID của chương cần lấy
 * @return nội dung chương tương ứng dưới dạng ApiRespone
 */
	@GetMapping(value = "/{idChapter}")
	@Operation(summary = "Lấy chương theo ID", description = "Trả về nội dung của chương theo ID chương.")
	public ApiRespone<ChapterRespone> getChapterById(@PathVariable String idChapter) {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.getChapterById(idChapter)).build();
	}
/**
 * API tạo chương mới cho truyện, có thể đính kèm file văn bản .txt làm nội dung chương.
 *
 * @param request thông tin tạo chương (bao gồm tiêu đề, ID truyện, thứ tự, ...)
 * @param textFile file nội dung chương dạng .txt (tùy chọn)
 * @return chương mới vừa được tạo, bọc trong ApiRespone
 * @throws IOException nếu có lỗi đọc file
 * @throws InterruptedException nếu bị ngắt trong quá trình xử lý bất đồng bộ
 */
	@PostMapping(value = "/create", consumes = { "multipart/form-data" })
	@Operation(summary = "Tạo chương mới", description = "Tạo mới một chương cho truyện, có thể đính kèm file nội dung chương (dạng text).")
	public ApiRespone<ChapterRespone> createChapter(@RequestPart ChapterCreationRequest request,
			@RequestParam(required = false) MultipartFile textFile) throws IOException, InterruptedException {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.createChapter(request, textFile)).build();
	}
/**
 * API tăng lượt xem cho chương truyện theo ID chương.
 *
 * @param idChapter ID của chương cần tăng lượt xem
 * @return số lượt xem sau khi đã tăng, bọc trong ApiRespone
 */
	@GetMapping(value = "increaseViewChapter/{idChapter}")
	@Operation(summary = "Tăng lượt xem chương", description = "Tăng số lượt xem cho chương có ID tương ứng và trả về tổng lượt xem sau khi tăng.")
	public ApiRespone<Integer> increaseViewChapter(@PathVariable String idChapter) {
		return ApiRespone.<Integer>builder().result(chapterService.increaseView(idChapter)).build();
	}
/**
 * API cập nhật thông tin chương, có thể thay đổi nội dung chương từ file mới (nếu có).
 *
 * @param request thông tin cập nhật chương (ID chương, tiêu đề, nội dung,...)
 * @param textFile file văn bản mới nếu cần thay đổi nội dung chương (tùy chọn)
 * @return thông tin chương sau khi cập nhật, bọc trong ApiRespone
 * @throws IOException nếu có lỗi xử lý file
 */
	@PutMapping(value = "/update", consumes = { "multipart/form-data" })
	@Operation(summary = "Cập nhật chương", description = "Cập nhật nội dung chương, có thể thay đổi file nội dung nếu cần.")
	public ApiRespone<ChapterRespone> updateChapter(@RequestPart ChapterUpdateRequest request,
			@RequestParam(required = false) MultipartFile textFile) throws IOException {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.updateChapter(request, textFile)).build();
	}
/**
 * API xoá một chương ra khỏi hệ thống theo ID chương.
 *
 * @param idChapter ID của chương cần xoá
 * @return ID chương đã được xoá, bọc trong ApiRespone
 */
	@DeleteMapping(value = "/{idChapter}")
	@Operation(summary = "Xoá chương", description = "Xoá chương theo ID.")
	public ApiRespone<String> deleteChapter(@PathVariable String idChapter) {
		return ApiRespone.<String>builder().result(chapterService.deleteChapter(idChapter)).build();
	}
}
