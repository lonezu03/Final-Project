package com.example.demo.controller;

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
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.dto.request.CommentCreationRequest;
import com.example.demo.dto.request.CommentSearchRequest;
import com.example.demo.dto.request.CommentUpdateLikeRequest;
import com.example.demo.dto.request.CommentUpdateRequest;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.CommentNovelRespone;
import com.example.demo.dto.respone.CommentRespone;
import com.example.demo.service.CommentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RequestMapping("/comment")
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Comment Controller", description = "API quản lý bình luận: tạo, chỉnh sửa, xoá, like/dislike, lọc theo chương, truyện hoặc người dùng")
public class CommentController {

	CommentService commentService;
/**
 * API lấy danh sách bình luận theo chương.
 *
 * @param idChapter ID chương cần lấy bình luận
 * @return danh sách các bình luận thuộc chương tương ứng, bọc trong ApiRespone
 */
	@GetMapping(value = "/getAllByChapter/{idChapter}")
	@Operation(summary = "Lấy danh sách bình luận theo chương", description = "Trả về danh sách các bình luận thuộc chương truyện có ID tương ứng.")
	public ApiRespone<List<CommentRespone>> getAllCommentByChapter(
			@PathVariable(name = "idChapter") String idChapter) {
		return ApiRespone.<List<CommentRespone>>builder()
				.result(commentService.getListCommentByChapter(idChapter))
				.build();
	}
/**
 * API lấy danh sách bình luận của người dùng.
 *
 * @param idUser ID người dùng cần lấy bình luận
 * @return danh sách bình luận do người dùng đăng, bọc trong ApiRespone
 */
	@GetMapping(value = "/getAllByUser/{idUser}")
	@Operation(summary = "Lấy danh sách bình luận theo người dùng", description = "Trả về tất cả bình luận được đăng bởi người dùng có ID tương ứng.")
	public ApiRespone<List<CommentRespone>> getAllCommentByUser(@PathVariable(name = "idUser") String idUser) {
		return ApiRespone.<List<CommentRespone>>builder()
				.result(commentService.getListCommentByUser(idUser))
				.build();
	}
/**
 * API tìm kiếm bình luận theo nhiều tiêu chí: nội dung, chương, truyện, lượt thích, dislike,...
 *
 * @param request yêu cầu tìm kiếm (nội dung, idChapter, idUser, thời gian,...)
 * @param pageable phân trang kết quả
 * @return danh sách bình luận phù hợp dưới dạng phân trang
 */
	@PostMapping("/search")
	public ResponseEntity<Page<CommentRespone>> searchComments(
			@RequestBody CommentSearchRequest request,
			Pageable pageable) {

		Page<CommentRespone> comments = commentService.searchComments(request, pageable);
		return ResponseEntity.ok(comments);
	}
/**
 * API lấy danh sách bình luận theo truyện.
 *
 * @param idNovel ID truyện cần lấy tất cả bình luận từ các chương
 * @return danh sách các bình luận theo chương trong truyện, bọc trong ApiRespone
 */
	@GetMapping(value = "/getAllByNovel/{idNovel}")
	@Operation(summary = "Lấy danh sách bình luận theo truyện", description = "Trả về tất cả bình luận thuộc các chương của truyện có ID tương ứng.")
	public ApiRespone<List<CommentNovelRespone>> getAllCommentByNovel(@PathVariable(name = "idNovel") String idNovel) {
		return ApiRespone.<List<CommentNovelRespone>>builder()
				.result(commentService.getListCommentByNovel(idNovel))
				.build();
	}
/**
 * API tạo mới một bình luận cho chương truyện.
 *
 * @param request thông tin tạo bình luận (idUser, idChapter, nội dung,...)
 * @return bình luận vừa được tạo, bọc trong ApiRespone
 */
	@PostMapping("/create")
	@Operation(summary = "Tạo bình luận mới", description = "Tạo mới một bình luận cho chương truyện.")
	public ApiRespone<CommentRespone> createChapter(@RequestBody CommentCreationRequest request) {
		return ApiRespone.<CommentRespone>builder()
				.result(commentService.createComment(request))
				.build();
	}
/**
 * API cập nhật nội dung một bình luận đã có.
 *
 * @param request thông tin cần cập nhật (idComment, nội dung mới)
 * @return bình luận sau khi cập nhật, bọc trong ApiRespone
 */
	@PutMapping("/update")
	@Operation(summary = "Cập nhật bình luận", description = "Chỉnh sửa nội dung bình luận hiện có.")
	public ApiRespone<CommentRespone> updateChapter(@RequestBody CommentUpdateRequest request) {
		return ApiRespone.<CommentRespone>builder()
				.result(commentService.updateComment(request))
				.build();
	}
/**
 * API tăng lượt like cho một bình luận.
 *
 * @param request chứa idUser và idComment cần tăng like
 * @return bình luận sau khi đã tăng like, bọc trong ApiRespone
 */
	@PutMapping("/updatelike")
	@Operation(summary = "Tăng lượt like cho bình luận", description = "Tăng số lượt thích (like) cho bình luận.")
	public ApiRespone<CommentRespone> upLike(@RequestBody CommentUpdateLikeRequest request) {
		return ApiRespone.<CommentRespone>builder()
				.result(commentService.updatelikeComment(request))
				.build();
	}
	
/**
 * API tăng lượt dislike cho một bình luận.
 *
 * @param request chứa idUser và idComment cần tăng dislike
 * @return bình luận sau khi đã tăng dislike, bọc trong ApiRespone
 */
	@PutMapping("/updatedislike")
	@Operation(summary = "Tăng lượt dislike cho bình luận", description = "Tăng số lượt không thích (dislike) cho bình luận.")
	public ApiRespone<CommentRespone> upDislike(@RequestBody CommentUpdateLikeRequest request) {
		return ApiRespone.<CommentRespone>builder()
				.result(commentService.updatedislikeComment(request))
				.build();
	}
/**
 * API xoá bình luận theo ID.
 *
 * @param idComment ID bình luận cần xoá
 * @return ID của bình luận đã xoá (hoặc mã trạng thái), bọc trong ApiRespone
 */
	@DeleteMapping(value = "/{idComment}")
	@Operation(summary = "Xoá bình luận", description = "Xoá bình luận theo ID.")
	public ApiRespone<Integer> deleteComment(@PathVariable(name = "idComment") Integer idComment) {
		return ApiRespone.<Integer>builder()
				.result(commentService.deleteComment(idComment))
				.build();
	}

}
