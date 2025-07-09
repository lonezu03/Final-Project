package com.example.demo.service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.example.demo.dto.request.FollowNovelRequest;
import com.example.demo.entity.FollowNovel;
import com.example.demo.entity.FollowNovelId;
import com.example.demo.entity.Novel;
import com.example.demo.entity.User;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.repository.IFollowNovelRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IUserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Service xử lý logic liên quan đến việc người dùng theo dõi truyện.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FollowNovelService {

	IUserRepository userRepository;
	INovelRepository novelRepository;
	IFollowNovelRepository followNovelRepository;

	/**
	 * Cho phép người dùng theo dõi một truyện nếu chưa theo dõi trước đó.
	 * <p>
	 * Kiểm tra sự tồn tại của user và novel, sau đó kiểm tra xem người dùng đã theo
	 * dõi truyện hay chưa. Nếu chưa thì tạo mới một bản ghi FollowNovel.
	 *
	 * @param request Yêu cầu theo dõi truyện (chứa idUser và idNovel)
	 * @throws AppException nếu người dùng hoặc truyện không tồn tại, hoặc nếu đã
	 *                      theo dõi rồi
	 */
	public void followNovel(FollowNovelRequest request) {
		User user = userRepository.findById(request.getIdUser())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		Novel novel = novelRepository.findById(request.getIdNovel())
				.orElseThrow(() -> new AppException(ErrorCode.NOVEL_NOT_EXISTED));

		FollowNovelId followNovelId = FollowNovelId.builder().idUser(request.getIdUser()).idNovel(request.getIdNovel())
				.build();
		
		boolean followExist = followNovelRepository.existsById(followNovelId);
		

		if (followExist) {

			followNovelRepository.deleteById(followNovelId);
		} else {
			FollowNovel followNovel = FollowNovel.builder().id(followNovelId).user(user).novel(novel).build();

			followNovelRepository.save(followNovel);
		}

	}

}
