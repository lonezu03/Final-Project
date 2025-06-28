package com.example.demo.service;

import java.util.List;
import java.util.Optional;

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

	/**
	 * 
	 * @param idChapter
	 * @return
	 */
	public List<CommentRespone> getListCommentByChapter(String idChapter) {
		List<Comment> comments = commentRepository.findByChapter_IdChapter(idChapter);

		return comments.stream().map(t -> commentMapper.toCommentRespone(t)).toList();
	}

	public List<CommentRespone> getListCommentByUser(String idUser) {
		List<Comment> comments = commentRepository.findByUser_IdUser(idUser);

		return comments.stream().map(t -> commentMapper.toCommentRespone(t)).toList();
	}

	public List<CommentNovelRespone> getListCommentByNovel(String idNovel) {
		List<Comment> comments = commentRepository.findAllByNovelId(idNovel);

		return comments.stream().map(t -> commentMapper.toCommentNovelRespone(t)).toList();
	}

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

	public CommentRespone updateComment(CommentUpdateRequest request) {
		User user = userRepository.findByIdUser(request.getUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		Chapter chapter = chapterRepository.findById(request.getChapter()).get();

		Comment comment = commentMapper.toCommentUpdate(request);
		comment.setUser(user);
		comment.setChapter(chapter);

		comment = commentRepository.save(comment);
		return commentMapper.toCommentRespone(comment);
	}

	public CommentRespone updatelikeComment(CommentUpdateLikeRequest request) {
		User user = userRepository.findByIdUser(request.getIdUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		Comment comment = commentRepository.findById(request.getIdComment()).get();

		Optional<CommentDislike> existingDislikeOpt = commentDislikeRepository.findByUserAndComment(user, comment);
		Optional<CommentLike> existingLikeOpt = commentLikeRepository.findByUserAndComment(user, comment);

		if (!existingDislikeOpt.isPresent()) {
			if (existingLikeOpt.isPresent()) {
				CommentLike commentLike = existingLikeOpt.get();

				comment.setLikeComment(comment.getLikeComment() - 1);

				comment.getLikes().remove(commentLike);
			} else {
				comment.setLikeComment(comment.getLikeComment() + 1);
				comment.getLikes().add(CommentLike.builder().comment(comment).user(user).build());
			}
		}else {
			CommentDislike commentDislike = existingDislikeOpt.get();

			comment.setDislikeComment(comment.getDislikeComment() - 1);

			comment.getDislikes().remove(commentDislike);
			
			comment.setLikeComment(comment.getLikeComment() + 1);
			
			comment.getLikes().add(CommentLike.builder().comment(comment).user(user).build());
		}
		
		

		comment = commentRepository.save(comment);

		return commentMapper.toCommentRespone(comment);
	}

	public CommentRespone updatedislikeComment(CommentUpdateLikeRequest request) {
		User user = userRepository.findByIdUser(request.getIdUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		Comment comment = commentRepository.findById(request.getIdComment()).get();

		Optional<CommentDislike> existingDislikeOpt = commentDislikeRepository.findByUserAndComment(user, comment);
		Optional<CommentLike> existingLikeOpt = commentLikeRepository.findByUserAndComment(user, comment);

		if (!existingLikeOpt.isPresent()) {
			if (existingDislikeOpt.isPresent()) {
				CommentDislike commentDislike = existingDislikeOpt.get();

				comment.setDislikeComment(comment.getDislikeComment() - 1);

				comment.getDislikes().remove(commentDislike);

			} else

			{
				comment.setDislikeComment(comment.getDislikeComment()+1);

				comment.getDislikes().add(CommentDislike.builder().comment(comment).user(user).build());
			}
		}else {
			CommentLike commentLike = existingLikeOpt.get();

			comment.setLikeComment(comment.getLikeComment()-1);;

			comment.getLikes().remove(commentLike);

			comment.setLikeComment(comment.getDislikeComment() + 1);

			comment.getDislikes().add(CommentDislike.builder().comment(comment).user(user).build());
		}

		comment = commentRepository.save(comment);

		return commentMapper.toCommentRespone(comment);

	}

	public Integer deleteComment(Integer idComment) {
		try {
			commentRepository.deleteById(idComment);
		} catch (Exception e) {
			throw new AppException(ErrorCode.ERRO_WHEN_DELETE_COMMENT);
		}
		return idComment;
	}

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

			CommentRespone commentRespone = commentMapper.toCommentRespone(comment);

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

}
