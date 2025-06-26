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


	@PostMapping("/getAll")
	@Operation(summary = "Lấy danh sách chương theo truyện", description = "Trả về danh sách tất cả các chương thuộc truyện có ID tương ứng.")
	public ApiRespone<List<ChapterRespone>> getAll(@RequestBody ChapterGetByIdNovelRequest request) throws JOSEException, ParseException {
		return ApiRespone.<List<ChapterRespone>>builder().result(chapterService.getAllChapter(request)).build();
	}

	@GetMapping(value = "/{idChapter}")
	@Operation(summary = "Lấy chương theo ID", description = "Trả về nội dung của chương theo ID chương.")
	public ApiRespone<ChapterRespone> getChapterById(@PathVariable String idChapter) {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.getChapterById(idChapter)).build();
	}

	@PostMapping(value = "/create", consumes = { "multipart/form-data" })
	@Operation(summary = "Tạo chương mới", description = "Tạo mới một chương cho truyện, có thể đính kèm file nội dung chương (dạng text).")
	public ApiRespone<ChapterRespone> createChapter(@RequestPart ChapterCreationRequest request,
			@RequestParam(required = false) MultipartFile textFile) throws IOException, InterruptedException {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.createChapter(request, textFile)).build();
	}

	@GetMapping(value = "increaseViewChapter/{idChapter}")
	@Operation(summary = "Tăng lượt xem chương", description = "Tăng số lượt xem cho chương có ID tương ứng và trả về tổng lượt xem sau khi tăng.")
	public ApiRespone<Integer> increaseViewChapter(@PathVariable String idChapter) {
		return ApiRespone.<Integer>builder().result(chapterService.increaseView(idChapter)).build();
	}

	@PutMapping(value = "/update", consumes = { "multipart/form-data" })
	@Operation(summary = "Cập nhật chương", description = "Cập nhật nội dung chương, có thể thay đổi file nội dung nếu cần.")
	public ApiRespone<ChapterRespone> updateChapter(@RequestPart ChapterUpdateRequest request,
			@RequestParam(required = false) MultipartFile textFile) throws IOException {
		return ApiRespone.<ChapterRespone>builder().result(chapterService.updateChapter(request, textFile)).build();
	}

	@DeleteMapping(value = "/{idChapter}")
	@Operation(summary = "Xoá chương", description = "Xoá chương theo ID.")
	public ApiRespone<String> deleteChapter(@PathVariable String idChapter) {
		return ApiRespone.<String>builder().result(chapterService.deleteChapter(idChapter)).build();
	}
}
