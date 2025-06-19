package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.CommentCreationRequest;
import com.example.demo.dto.request.CommentUpdateLikeRequest;
import com.example.demo.dto.request.CommentUpdateRequest;
import com.example.demo.dto.respone.CommentNovelRespone;
import com.example.demo.dto.respone.CommentRespone;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.Comment;
import com.example.demo.entity.User;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.ICommentMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.ICommentRepository;
import com.example.demo.repository.IUserRepository;

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

	public List<CommentRespone> getListCommentByChapter(Integer idChapter) {
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
		
		if (request.getChapter()!=null) {
			Chapter chapter = chapterRepository.findById(request.getChapter()).orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));
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
		Chapter chapter = chapterRepository.findById(request.getIdChapter()).get();

		Comment comment = commentRepository.findById(request.getIdComment()).get();
		comment.setUser(user);
		comment.setChapter(chapter);
		comment.setLikeComment(comment.getLikeComment() + 1);
		comment = commentRepository.save(comment);
		return commentMapper.toCommentRespone(comment);
	}

	public CommentRespone updatedislikeComment(CommentUpdateLikeRequest request) {
		User user = userRepository.findByIdUser(request.getIdUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		Chapter chapter = chapterRepository.findById(request.getIdChapter()).get();

		Comment comment = commentRepository.findById(request.getIdComment()).get();
		comment.setChapter(chapter);
		comment.setUser(user);
		comment.setDislikeComment(comment.getDislikeComment() + 1);
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

}
