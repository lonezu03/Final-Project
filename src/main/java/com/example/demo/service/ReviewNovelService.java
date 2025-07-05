package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.joda.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.ReviewNovelCreationRequest;
import com.example.demo.dto.respone.ReviewNovelRespone;
import com.example.demo.entity.Novel;
import com.example.demo.entity.ReviewNovel;
import com.example.demo.entity.ReviewNovelId;
import com.example.demo.entity.User;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IReviewNovelMapper;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IReviewNovelRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewNovelService {

	IReviewNovelRepository reviewNovelRepository;
	INovelRepository novelRepository;
	IUserRepository userRepository;
	IReviewNovelMapper reviewNovelMapper;

	Logger logger = LoggerFactory.getLogger(ReviewNovelService.class);

	/**
	 * Lấy danh sách review novel theo id novel
	 * 
	 * @param idNovel
	 * @return
	 */
	public List<ReviewNovelRespone> getAllReviewNovelByIdNovel(String idNovel) {
		try {
			Novel novel = novelRepository.findById(idNovel)
					.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));

			return reviewNovelRepository.findByNovel(novel).stream().map(t -> reviewNovelMapper.toReviewNovelRespone(t))
					.collect(Collectors.toList());

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("getAllReviewNovelByIdNovel error");
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

	/**
	 * Tạo review novel
	 * 
	 * @param request
	 * @return
	 */

	public ReviewNovelRespone createReviewNovel(ReviewNovelCreationRequest request) {
		try {
			Novel novel = novelRepository.findById(request.getIdNovel())
					.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));

			User user = userRepository.findById(request.getIdUser())
					.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
			
			ReviewNovelId reviewNovelId = ReviewNovelId.builder().idNovel(request.getIdNovel())
					.idUser(request.getIdUser()).build();
			if (reviewNovelRepository.existsByUserAndNovel(user, novel)) {
				ReviewNovel oldReviewNovel=reviewNovelRepository.findById(reviewNovelId).orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOVEL_NOT_EXISTS));
				ReviewNovel reviewNovel = reviewNovelMapper.toReviewNovel(request);
				

				reviewNovel.setId(reviewNovelId);
				reviewNovel.setNovel(novel);
				reviewNovel.setUser(user);
				reviewNovel.setReviewTime(LocalDateTime.now());
				reviewNovelMapper.updateReviewNovel(reviewNovel, oldReviewNovel);
				
				oldReviewNovel= reviewNovelRepository.save(reviewNovel);
				return reviewNovelMapper.toReviewNovelRespone(oldReviewNovel);
			}
			
			ReviewNovel reviewNovel = reviewNovelMapper.toReviewNovel(request);
		

			reviewNovel.setId(reviewNovelId);
			reviewNovel.setNovel(novel);
			reviewNovel.setUser(user);
			reviewNovel.setReviewTime(LocalDateTime.now());
			reviewNovel = reviewNovelRepository.save(reviewNovel);

			return reviewNovelMapper.toReviewNovelRespone(reviewNovel);
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("createReviewNovel error");
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}

	}

	/**
	 * xóa reivew novel bằng id novel và id user
	 * @param reviewNovelId
	 * @return
	 */
	public ReviewNovelId deleteReviewNovel(ReviewNovelId reviewNovelId) {
		try {
			reviewNovelRepository.deleteById(reviewNovelId);
			return reviewNovelId;
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("deleteReviewNovel error");
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

}
