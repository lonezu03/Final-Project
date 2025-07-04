package com.example.demo.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.request.CreateHistoryReadRequest;
import com.example.demo.dto.request.TokenRefreshRequest;
import com.example.demo.dto.request.UpdateHistoryRequest;
import com.example.demo.dto.request.UserCreationByEmailRequest;
import com.example.demo.dto.request.UserCreationRequest;
import com.example.demo.dto.request.UserLoginByEmailRequest;
import com.example.demo.dto.request.UserLoginRequest;
import com.example.demo.dto.request.UserUpdateRequest;
import com.example.demo.dto.respone.HistoryReadNovelRespone;
import com.example.demo.dto.respone.HistoryReadSubRespone;
import com.example.demo.dto.respone.UploadFileRespone;
import com.example.demo.dto.respone.UserLoginRespone;
import com.example.demo.dto.respone.UserRespone;
import com.example.demo.entity.Chapter;
import com.example.demo.entity.HistoryId;
import com.example.demo.entity.HistoryRead;
import com.example.demo.entity.Novel;
import com.example.demo.entity.RefreshToken;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.mapper.IHistoryReadMapper;
import com.example.demo.mapper.IUserMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.IHistoryReadRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IUserRepository;
import com.example.demo.repository.RefreshTokenRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Service xử lý các nghiệp vụ liên quan đến người dùng.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

	IUserRepository userRepository;
	IUserMapper userMapper;
	PasswordEncoder passwordEncoder;
	UploadFileService uploadFileService;
	INovelRepository novelRepository;
	IHistoryReadRepository historyReadRepository;
	IHistoryReadMapper historyReadMapper;
	HistoryReadService historyReadService;
	AuthenticationService authenticationService;
	RefreshTokenRepository refreshTokenRepository;
	IChapterRepository chapterRepository;

	/**
	 * Lấy danh sách tất cả người dùng từ database và map sang DTO UserRespone.
	 *
	 * @return danh sách UserRespone
	 */
	public List<UserRespone> getAllUser() {
		return userRepository.findAll().stream().map(t -> userMapper.toUserRespone(t)).toList();
	}

	/**
	 * Tạo mới một người dùng thông qua form đăng ký đầy đủ.
	 *
	 * @param request Dữ liệu đầu vào từ client
	 * @return UserRespone sau khi tạo
	 * @throws AppException nếu email đã tồn tại
	 */
	public UserRespone createUser(UserCreationRequest request) {
		User user = userRepository.findByEmailUser(request.getEmailUser());

		if (user != null) {
			throw new AppException(ErrorCode.USER_EXISTED);
		}

		String userName = request.getEmailUser().split("@")[0];

		user = userMapper.toUser(request);
		user.setUserNameUser(userName);
		user.setCoin(0);
		user.setRole(Role.MEMBER);
		user.setPasswordUser(passwordEncoder.encode(request.getPasswordUser()));

		return userMapper.toUserRespone(userRepository.save(user));
	}

	/**
	 * Tạo người dùng bằng email (dành cho đăng nhập bằng Google hoặc bên thứ ba).
	 *
	 * @param request Yêu cầu chứa email
	 * @return UserRespone sau khi tạo
	 * @throws AppException nếu email đã tồn tại
	 */
	public UserRespone createUserByEmail(UserCreationByEmailRequest request) {
		User user = userRepository.findByEmailUser(request.getEmail());

		if (user != null) {
			throw new AppException(ErrorCode.USER_EXISTED);
		}

		String userName = request.getEmail().split("@")[0];

		user = userMapper.toUserByEmail(request);
		user.setCoin(0);
		user.setRole(Role.MEMBER);
		user.setUserNameUser(userName);

		return userMapper.toUserRespone(userRepository.save(user));
	}

	/**
	 * Đăng nhập người dùng bằng email và mật khẩu.
	 *
	 * @param request Dữ liệu đăng nhập
	 * @return UserRespone chứa thông tin người dùng, lịch sử đọc và token
	 * @throws AppException nếu không tìm thấy người dùng hoặc mật khẩu sai
	 */
	public UserRespone login(UserLoginRequest request) {
		User user = userRepository.findByEmailUser(request.getEmail());
		if (user == null) {
			throw new AppException(ErrorCode.USER_NOT_EXISTED);
		}

		PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
		boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordUser());

		if (!matches) {
			throw new AppException(ErrorCode.PASSWORD_NOT_MATCHED);
		}

		UserRespone userRespone = userMapper.toUserRespone(user);
		List<HistoryRead> allHistories = historyReadRepository.findByIDUser(user.getIdUser());
		userRespone.setHistoryRead(buildHistoryGroupedByNovel(allHistories));

		userRespone.setToken(authenticationService.generateToken(user));
		return userRespone;
	}

	/**
	 * Đăng nhập người dùng bằng email (ví dụ qua Google). Nếu chưa tồn tại, tự động
	 * tạo tài khoản.
	 *
	 * @param request yêu cầu đăng nhập bằng email
	 * @return UserRespone chứa thông tin người dùng, lịch sử đọc và token
	 */
	public UserRespone loginByEmail(UserLoginByEmailRequest request) {
		User user = userRepository.findByEmailUser(request.getEmail());
		if (user == null) {
			createUserByEmail(UserCreationByEmailRequest.builder().email(request.getEmail()).build());
		}

		UserRespone userRespone = userMapper.toUserRespone(user);
		List<HistoryRead> allHistories = historyReadRepository.findByIDUser(user.getIdUser());
		userRespone.setHistoryRead(buildHistoryGroupedByNovel(allHistories));

		userRespone.setToken(authenticationService.generateToken(user));

		return userRespone;
	}

	/**
	 * Cấp quyền MANAGER cho người dùng theo ID.
	 *
	 * @param idUser ID của người dùng cần cấp quyền
	 * @return UserRespone sau khi cập nhật quyền kèm token mới
	 * @throws AppException nếu không tìm thấy người dùng
	 */
	public UserRespone grantRole(String idUser) {
		User user = userRepository.findByIdUser(idUser).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		user.setRole(Role.MANAGER);
		user = userRepository.save(user);

		UserRespone userRespone = userMapper.toUserRespone(user);
		userRespone.setToken(authenticationService.generateToken(user));
		return userRespone;
	}

	/**
	 * Cập nhật thông tin người dùng dựa theo email.
	 *
	 * @param request Dữ liệu cập nhật từ người dùng
	 * @return UserRespone sau khi cập nhật
	 * @throws IOException  nếu có lỗi khi xử lý dữ liệu
	 * @throws AppException nếu không tìm thấy người dùng
	 */
	public UserRespone updateUser(UserUpdateRequest request) throws IOException {
		User user = userRepository.findByEmailUser(request.getEmailUser());

		if (user == null) {
			throw new AppException(ErrorCode.USER_NOT_EXISTED);
		}

		userMapper.updateUser(request, user);

		return userMapper.toUserRespone(userRepository.save(user));
	}

	/**
	 * Cập nhật avatar người dùng bằng cách upload ảnh mới.
	 *
	 * @param avatar File ảnh mới
	 * @param email  Email người dùng
	 * @return UserRespone sau khi cập nhật avatar
	 * @throws IOException  nếu có lỗi khi xử lý file
	 * @throws AppException nếu không tìm thấy người dùng
	 */
	public UserRespone uploadUser(MultipartFile avatar, String email) throws IOException {
		User user = userRepository.findByEmailUser(email);

		if (user == null) {
			throw new AppException(ErrorCode.USER_NOT_EXISTED);
		}
		if (user.getAvatarUser() != null && !user.getAvatarUser().isEmpty()) {
			uploadFileService.deleteImage(user.getPublicIdAvartarUser());
		}
		UploadFileRespone respone = uploadFileService.uploadFile(avatar);
		user.setAvatarUser(respone.getUrl());
		user.setPublicIdAvartarUser(respone.getPublic_id());
		return userMapper.toUserRespone(userRepository.save(user));
	}

	/**
	 * Xóa người dùng theo ID.
	 *
	 * @param idUser ID người dùng cần xóa
	 * @return ID người dùng đã bị xóa
	 * @throws AppException nếu không tìm thấy người dùng
	 */
	public String deleteUser(String idUser) {
		User user = userRepository.findByIdUser(idUser).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		if (user == null) {
			throw new AppException(ErrorCode.USER_NOT_EXISTED);
		}
		userRepository.deleteById(idUser);
		return idUser;
	}

	/**
	 * Tạo hoặc cập nhật lịch sử đọc truyện của người dùng.
	 *
	 * @param readRequest Thông tin lịch sử đọc được gửi từ client
	 * @return UserRespone sau khi cập nhật hoặc tạo lịch sử đọc, kèm danh sách lịch
	 *         sử đọc hiện tại
	 * @throws AppException nếu không tìm thấy người dùng
	 */
	public UserRespone createHistoryRead(CreateHistoryReadRequest readRequest) {
		User user = userRepository.findByEmailUser(readRequest.getEmail());
		Chapter chapter = chapterRepository.findById(readRequest.getIdChapter())
				.orElseThrow(() -> new AppException(ErrorCode.CHAPTER_NOT_EXISTED));

		HistoryId historyId = HistoryId.builder().idChapter(readRequest.getIdChapter()).idUser(user.getIdUser())
				.build();

		HistoryRead historyRead = HistoryRead.builder().id(historyId).chapter(chapter).readingTime(LocalDateTime.now())

				.readPlace(readRequest.getReadPlace()).user(user).build();


		Optional<HistoryRead> historyReadPast = historyReadRepository.findByUser_IdUserAndChapter_IdChapter(user.getIdUser(),chapter.getIdChapter());
		if (!historyReadPast.isEmpty()) {
			historyReadMapper.updateHistoryRead(historyRead, historyReadPast.get());
			historyRead = historyReadRepository.save(historyReadPast.get());

			UserRespone userRespone = userMapper.toUserRespone(user);
			
			List<HistoryRead> allHistories = historyReadRepository.findByIDUser(user.getIdUser());
			userRespone.setHistoryRead(buildHistoryGroupedByNovel(allHistories));

			return userRespone;
		}

		historyRead = historyReadRepository.save(historyRead);
		UserRespone userRespone = userMapper.toUserRespone(user);
		
		List<HistoryRead> allHistories = historyReadRepository.findByIDUser(user.getIdUser());
		userRespone.setHistoryRead(buildHistoryGroupedByNovel(allHistories));

		return userRespone;
	}

	private List<HistoryReadNovelRespone> buildHistoryGroupedByNovel(List<HistoryRead> histories) {
	    return histories.stream()
	        .collect(Collectors.groupingBy(hr -> hr.getChapter().getNovel()))
	        .entrySet().stream()
	        .map((Map.Entry<Novel, List<HistoryRead>> entry) -> {
	            Novel novel = entry.getKey();
	            List<HistoryRead> chapterHistories = entry.getValue();

	            List<HistoryReadSubRespone> subs = chapterHistories.stream().map(hr -> {
	                HistoryReadSubRespone sub = historyReadMapper.toHistoryReadRespone(hr);
	                sub.setNameNovel(novel.getNameNovel());
	                sub.setUrlNovel(novel.getImageNovel());
	                sub.setTitleChapter(hr.getChapter().getTitleChapter());
	                return sub;
	            }).collect(Collectors.toList());

	            return HistoryReadNovelRespone.builder()
	                    .nameNovel(novel.getNameNovel())
	                    .historyReadRespones(subs)
	                    .build();
	        }).collect(Collectors.toList());
	}


	
	
///**
// * Generate a new accessToken from a valid refreshToken.
// *
// * @param refreshRequest Object containing refreshToken.
// * @return A LoginResponse containing the new accessToken and existing refreshToken.
// * @throws AppException if the token is not found or expired.
// */
//public UserLoginRespone refreshToken(TokenRefreshRequest refreshRequest) {
//	try {
//		RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshRequest.getRefreshToken())
//				.orElseThrow(() -> new AppException("REFRESH_TOKEN_NOT_EXISTS"));
//
//		if (refreshTokenService.verifiedRefreshToken(refreshToken) != null) {
//			String accessToken = authenticationService.generateToken(refreshToken.getUser(),
//					refreshToken.getToken());
//
//			return UserLoginRespone.builder().accessToken(accessToken).refreshToken(refreshToken.getToken()).build();
//		}
//
//		throw new AppException("REFRESH_TOKEN_EXPIRY");
//
//	} catch (AppException ex) {
//		logger.warn("Business logic error when refreshing token: {}", ex.getMessage());
//		throw ex;
//	} catch (Exception ex) {
//		logger.error("System error when refreshing token", ex);
//		throw new AppException("UNCATEGORIZED_EXCEPTION");
//	}
//}

}
