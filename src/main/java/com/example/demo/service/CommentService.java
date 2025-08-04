package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.dto.request.CommentCreationRequest;
import com.example.demo.dto.request.CommentSearchRequest;
import com.example.demo.dto.request.CommentUpdateLikeRequest;
import com.example.demo.dto.request.CommentUpdateRequest;
import com.example.demo.dto.respone.CommentNovelRespone;
import com.example.demo.dto.respone.CommentRespone;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.Comment;
import com.example.demo.entity.CommentDislike;
import com.example.demo.entity.CommentLike;
import com.example.demo.entity.User;
import com.example.demo.enums.StringOperator;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.ICommentMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.ICommentDislikeRepository;
import com.example.demo.repository.ICommentLikeRepository;
import com.example.demo.repository.ICommentRepository;
import com.example.demo.repository.IUserRepository;
import com.example.demo.specification.CommentSpecification;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentService {

	ICommentRepository commentRepository;
	ICommentMapper commentMapper;
	IUserRepository userRepository;
	IChapterRepository chapterRepository;
	ICommentLikeRepository commentLikeRepository;
	ICommentDislikeRepository commentDislikeRepository;

    private static final Logger logger = LoggerFactory.getLogger(CommentService.class);

/**
 * Lấy danh sách tất cả comment theo ID chương.
 *
 * @param idChapter ID của chương
 * @return Danh sách các comment dưới dạng CommentRespone
 */
	public List<CommentRespone> getListCommentByChapter(String idChapter) {
		List<Comment> comments = commentRepository.findByChapter_IdChapter(idChapter);

		return comments.stream().map(t -> commentMapper.toCommentRespone(t)).toList();
	}
/**
 * Lấy danh sách comment mà một người dùng đã viết.
 *
 * @param idUser ID của người dùng
 * @return Danh sách comment của người dùng
 */
	public List<CommentRespone> getListCommentByUser(String idUser) {
		List<Comment> comments = commentRepository.findByUser_IdUser(idUser);

		return comments.stream().map(t -> commentMapper.toCommentRespone(t)).toList();
	}
/**
 * Lấy danh sách tất cả comment thuộc một truyện (theo ID truyện).
 *
 * @param idNovel ID của truyện
 * @return Danh sách comment dưới dạng CommentNovelRespone
 */
	public List<CommentNovelRespone> getListCommentByNovel(String idNovel) {
		List<Comment> comments = commentRepository.findAllByNovelId(idNovel);

		return comments.stream().map(t -> commentMapper.toCommentNovelRespone(t)).toList();
	}
/**
 * Tạo một comment mới, có thể thuộc chương hoặc phản hồi một comment khác.
 *
 * @param request Yêu cầu tạo comment mới
 * @return Comment sau khi đã lưu
 * @throws AppException nếu người dùng, chương hoặc comment cha không tồn tại
 */
	public CommentRespone createComment(CommentCreationRequest request) {
		User user = userRepository.findByIdUser(request.getUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		Comment comment = commentMapper.toComment(request);
		comment.setUser(user);
		comment.setDislikeComment(0);
		comment.setLikeComment(0);

		if (request.getChapter() != null) {
			Chapter chapter = chapterRepository.findById(request.getChapter())
					.orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));
			comment.setChapter(chapter);
		}

		if (request.getIdParent() != null) {
			Comment oldComment = commentRepository.findById(request.getIdParent())
					.orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));

			comment.setParent(oldComment);
		}

		comment = commentRepository.save(comment);
		return commentMapper.toCommentRespone(comment);
	}
/**
 * Cập nhật nội dung comment.
 *
 * @param request Yêu cầu cập nhật comment
 * @return Comment sau khi cập nhật
 */
	public CommentRespone updateComment(CommentUpdateRequest request) {
		User user = userRepository.findByIdUser(request.getUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		Chapter chapter = chapterRepository.findById(request.getIdchapter()).orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));
		
		Comment comment =commentRepository.findById(request.getIdComment()).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
		logger.info("Like: "+comment.getLikeComment());
		comment.setContentComment(request.getContentComment());
		comment.setUser(user);
		comment.setChapter(chapter);
		
		comment = commentRepository.save(comment);
		return commentMapper.toCommentRespone(comment);
	}
	/**
 * Thêm hoặc bỏ lượt thích cho comment. Nếu đang dislike thì sẽ bỏ dislike trước.
 *
 * @param request Yêu cầu cập nhật like
 * @return Comment sau khi xử lý
 */
	public CommentRespone updatelikeComment(CommentUpdateLikeRequest request) {
	    User user = userRepository.findByIdUser(request.getIdUser())
	            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

	    Comment comment = commentRepository.findById(request.getIdComment())
	            .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));

	    Optional<CommentDislike> existingDislikeOpt = commentDislikeRepository.findByUserAndComment(user, comment);
	    Optional<CommentLike> existingLikeOpt = commentLikeRepository.findByUserAndComment(user, comment);

	    // Nếu đã dislike => bỏ dislike trước
	    if (existingDislikeOpt.isPresent()) {
	        CommentDislike commentDislike = existingDislikeOpt.get();
	        comment.setDislikeComment(comment.getDislikeComment() - 1);
	        comment.getDislikes().remove(commentDislike);
	    }

	    if (existingLikeOpt.isPresent()) {
	        // Nếu đã like rồi => bỏ like (toggle off)
	        CommentLike commentLike = existingLikeOpt.get();
	        comment.setLikeComment(comment.getLikeComment() - 1);
	        comment.getLikes().remove(commentLike);
	    } else {
	        // Nếu chưa like => thêm like
	    	if (comment.getLikeComment()==null) {
		        comment.setLikeComment( 1);

			}else {
		        comment.setLikeComment(comment.getLikeComment() + 1);

			}
	        comment.getLikes().add(CommentLike.builder().comment(comment).user(user).build());
	    }

	    comment = commentRepository.save(comment);
	    return commentMapper.toCommentRespone(comment);
	}



/**
 * Thêm hoặc bỏ lượt không thích (dislike) cho comment. Nếu đang like thì sẽ bỏ like trước.
 *
 * @param request Yêu cầu cập nhật dislike
 * @return Comment sau khi xử lý
 */
	public CommentRespone updatedislikeComment(CommentUpdateLikeRequest request) {
	    User user = userRepository.findByIdUser(request.getIdUser())
	            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

	    Comment comment = commentRepository.findById(request.getIdComment())
	            .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));

	    Optional<CommentDislike> existingDislikeOpt = commentDislikeRepository.findByUserAndComment(user, comment);
	    Optional<CommentLike> existingLikeOpt = commentLikeRepository.findByUserAndComment(user, comment);

	    // Nếu đã like => bỏ like trước
	    if (existingLikeOpt.isPresent()) {
	        CommentLike commentLike = existingLikeOpt.get();
	        comment.setLikeComment(comment.getLikeComment() - 1);
	        comment.getLikes().remove(commentLike);
	    }

	    if (existingDislikeOpt.isPresent()) {
	        // Nếu đã dislike rồi => bỏ dislike (toggle off)
	        CommentDislike commentDislike = existingDislikeOpt.get();
	        comment.setDislikeComment(comment.getDislikeComment() - 1);
	        comment.getDislikes().remove(commentDislike);
	    } else {
	        // Nếu chưa dislike => thêm dislike
	    	if (comment.getDislikeComment()==null) {
		        comment.setDislikeComment(1);
			}else {
		        comment.setDislikeComment(comment.getDislikeComment() + 1);

			}
	        comment.getDislikes().add(CommentDislike.builder().comment(comment).user(user).build());
	    }

	    comment = commentRepository.save(comment);
	    return commentMapper.toCommentRespone(comment);
	}

/**
 * Xóa comment theo ID. Nếu có lỗi khi xóa sẽ ném ra AppException.
 *
 * @param idComment ID của comment cần xóa
 * @return ID comment đã xóa
 * @throws AppException nếu có lỗi xảy ra khi xóa
 */
	public Integer deleteComment(Integer idComment) {
		try {
			commentRepository.deleteById(idComment);
		} catch (Exception e) {
			throw new AppException(ErrorCode.ERRO_WHEN_DELETE_COMMENT);
		}
		return idComment;
	}
/**
 * Tìm kiếm comment theo nhiều tiêu chí: nội dung, chương, truyện, lượt thích, dislike,...
 * Hỗ trợ phân trang.
 *
 * @param request  Yêu cầu tìm kiếm
 * @param pageable Đối tượng phân trang
 * @return Page chứa danh sách comment phù hợp
 */
	@Transactional(readOnly = true)
	public Page<CommentRespone> searchComments(CommentSearchRequest request, Pageable pageable) {
		// Bắt đầu với một Specification không có điều kiện (tương đương với WHERE 1=1)
		Specification<Comment> spec = Specification.where(null);

		// 1. Lọc theo nội dung comment
		if (StringUtils.hasText(request.getContent())) {
			if (request.getContentOperator() == StringOperator.EQUALS) {
				spec = spec.and(CommentSpecification.contentEquals(request.getContent()));
			} else { // Mặc định là CONTAINS
				spec = spec.and(CommentSpecification.contentContains(request.getContent()));
			}
		}

//        // 2. Lọc theo ID người dùng
//        if (StringUtils.hasText(request.getIdUser())) {
//            spec = spec.and(CommentSpecification.byUser(request.getIdUser()));
//        }

		// 3. Lọc theo ID chương
		if (request.getIdChapter() != null) {
			spec = spec.and(CommentSpecification.byChapter(request.getIdChapter()));
		}

		// 4. Lọc theo ID truyện
		if (StringUtils.hasText(request.getIdNovel())) {
			spec = spec.and(CommentSpecification.byNovel(request.getIdNovel()));
		}

		// 5. Lọc theo số lượt thích
		if (request.getMinLikes() != null) {
			spec = spec.and(CommentSpecification.likesGreaterThanOrEqual(request.getMinLikes()));
		}

		// 6. Lọc theo số lượt không thích
		if (request.getMinDislikes() != null) {
			spec = spec.and(CommentSpecification.dislikesGreaterThanOrEqual(request.getMinDislikes()));
		}

		// 7. Lọc chỉ lấy comment gốc
		if (Boolean.TRUE.equals(request.getParentOnly())) {
			spec = spec.and(CommentSpecification.isParent());
		}

		// Thực thi truy vấn với Specification đã được xây dựng và có phân trang
		Page<Comment> commentPage = commentRepository.findAll(spec, pageable);

		return commentPage.map(comment -> {

//			User user=userRepository.findByIdUser(request.getIdUser()).get();
			CommentRespone commentRespone = getUrlImage(comment);
//			CommentRespone commentRespone=commentMapper.toCommentRespone(comment);
//			commentRespone.setUrlImage(comment.getUser().getAvatarUser());
			
			
			boolean isLikedByRequestUser = false;
			boolean isDislikeByRequestUser = false;

			if (StringUtils.hasText(request.getIdUser())) {
				isLikedByRequestUser = comment.getLikes().stream().anyMatch(
						like -> like.getUser() != null && request.getIdUser().equals(like.getUser().getIdUser()));
			}

			if (StringUtils.hasText(request.getIdUser())) {
				isDislikeByRequestUser = comment.getDislikes().stream().anyMatch(dislike -> dislike.getUser() != null
						&& request.getIdUser().equals(dislike.getUser().getIdUser()));
			}

			commentRespone.setIsDislike(isDislikeByRequestUser);
			commentRespone.setIsLike(isLikedByRequestUser);

			return commentRespone;
		});
	}
	
	private CommentRespone getUrlImage(Comment comment){
		CommentRespone commentRespone = commentMapper.toCommentRespone(comment);

		commentRespone.setUrlImage(comment.getUser().getAvatarUser());
		if (comment.getReplies()!=null && !comment.getReplies().isEmpty())  {
			List<CommentRespone> replyComment=new ArrayList<>();
			for (Comment reply : comment.getReplies()) {
	            CommentRespone replyResponse = getUrlImage(reply);
	            replyComment.add(replyResponse);
	        }
			commentRespone.setReplyComments(replyComment);
		}
		
		return commentRespone;
	}

}
