package com.example.demo.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.JsonSchemaValidator;
import com.example.demo.dto.request.CreateHistoryReadRequest;
import com.example.demo.dto.request.HistoryDepositUpdateRequest;
import com.example.demo.dto.request.RefreshUserRequest;
import com.example.demo.dto.request.ReviewNovelCreationRequest;
import com.example.demo.dto.request.UserCreateReportRequest;
import com.example.demo.dto.request.UserCreationByEmailRequest;
import com.example.demo.dto.request.UserCreationRequest;
import com.example.demo.dto.request.UserForgotPasswordRequest;
import com.example.demo.dto.request.UserLoginByEmailRequest;
import com.example.demo.dto.request.UserLoginRequest;
import com.example.demo.dto.request.UserUpdateRequest;
import com.example.demo.dto.respone.ApiRespone;
import com.example.demo.dto.respone.HistoryDepositGetAllRespone;
import com.example.demo.dto.respone.HistoryDepositRespone;
import com.example.demo.dto.respone.HistoryReadNovelRespone;
import com.example.demo.dto.respone.ReviewNovelRespone;
import com.example.demo.dto.respone.UserRespone;
import com.example.demo.entity.HistoryId;
import com.example.demo.entity.ReviewNovelId;
import com.example.demo.exception.AppException;
import com.example.demo.service.HistoryDepositService;
import com.example.demo.service.HistoryReadService;
import com.example.demo.service.MailService;
import com.example.demo.service.RefreshTokenService;
import com.example.demo.service.ReviewNovelService;
import com.example.demo.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Tag(name = "User Controller", description = "API quản lý người dùng: đăng ký, đăng nhập, cập nhật, xoá, OTP, avatar và lịch sử đọc")
public class UserController {

	UserService userService;
	MailService mailService;
	HistoryReadService historyReadService;
	ReviewNovelService reviewNovelService;
	HistoryDepositService historyDepositService;
	RefreshTokenService refreshTokenService;
	
	private SimpMessagingTemplate messagingTemplate;
	
	private static final Logger logger = LoggerFactory.getLogger(UserController.class);

	/**
	 * Lấy danh sách toàn bộ người dùng trong hệ thống.
	 *
	 * @return Danh sách người dùng hiện có.
	 */
	@GetMapping("/getAllUser")
	@Operation(summary = "Lấy tất cả người dùng", description = "Trả về danh sách tất cả người dùng hiện có trong hệ thống.")
	public ApiRespone<List<UserRespone>> getAllUser() {
		return ApiRespone.<List<UserRespone>>builder().result(userService.getAllUser()).build();
	}

	/**
	 * Tạo mới người dùng với thông tin đầy đủ như email, mật khẩu,...
	 *
	 * @param request Thông tin người dùng cần tạo.
	 * @return Thông tin người dùng sau khi tạo thành công.
	 */
	@PostMapping("/createUser")
	@Operation(summary = "Tạo người dùng mới", description = "Đăng ký người dùng thông thường bằng thông tin tài khoản.")
	public ApiRespone<UserRespone> createUser(@RequestBody UserCreationRequest request) {
		JsonSchemaValidator.validate(request, "UserCreationSchema.json");
		return ApiRespone.<UserRespone>builder().result(userService.createUser(request)).build();
	}

	/**
	 * Tạo mới người dùng chỉ với email (dùng cho OTP).
	 *
	 * @param request Đối tượng chứa email để tạo người dùng.
	 * @return Thông tin người dùng sau khi tạo thành công.
	 */
	@PostMapping("/createUserByEmail")
	@Operation(summary = "Tạo người dùng bằng email", description = "Đăng ký người dùng chỉ bằng email (dùng cho xác thực OTP).")
	public ApiRespone<UserRespone> createUserByEmail(@RequestBody UserCreationByEmailRequest request) {
		JsonSchemaValidator.validate(request, "UserCreationByEmailSchema.json");
		return ApiRespone.<UserRespone>builder().result(userService.createUserByEmail(request)).build();
	}

	/**
	 * Gửi mã OTP tới địa chỉ email để xác thực người dùng.
	 *
	 * @param email Địa chỉ email nhận mã OTP.
	 * @return Mã OTP đã được gửi.
	 */
	@PostMapping("/sendOTP")
	@Operation(summary = "Gửi OTP qua email", description = "Gửi mã OTP (6 chữ số) tới địa chỉ email để xác thực.")
	public ApiRespone<String> sendOTP(@RequestParam String email) {
		Map<String, String> emailWrapper = Map.of("email", email);
		JsonSchemaValidator.validate(emailWrapper, "UserSendOTPSchema.json");
		String otp = mailService.generateOTP(6);
		mailService.sendOTPEmail(email, "Xác nhận OTP", otp);
		return ApiRespone.<String>builder().result(otp).build();
	}

	@PostMapping(value = "/logout/{idUser}")
	@Operation(summary = "User Logout", description = "Logs out the user by deleting their refresh token.")
	public String logout(@PathVariable String idUser) {
		try {
			refreshTokenService.deleteRefreshTokenByIdUser(idUser);
			return "Log out successful!";
		} catch (AppException e) {
			logger.warn("Business error during user logout: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			logger.error("System error during user logout: {}", e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * Đăng nhập bằng email và mật khẩu.
	 *
	 * @param request Thông tin đăng nhập.
	 * @return Thông tin người dùng sau khi đăng nhập thành công.
	 */
	@PostMapping("/login")
	@Operation(summary = "Đăng nhập", description = "Đăng nhập bằng tài khoản thông thường (email và mật khẩu).")
	public ApiRespone<UserRespone> login(@RequestBody UserLoginRequest request) {
		return ApiRespone.<UserRespone>builder().result(userService.login(request)).build();
	}

	/**
	 * Đăng nhập bằng email không cần mật khẩu (thường dùng cho OTP).
	 *
	 * @param request Email của người dùng.
	 * @return Thông tin người dùng sau khi đăng nhập.
	 */
	@PostMapping("/loginByEmail")
	@Operation(summary = "Đăng nhập bằng email", description = "Đăng nhập nhanh chỉ với email (dành cho OTP).")
	public ApiRespone<UserRespone> loginByEmail(@RequestBody UserLoginByEmailRequest request) {
		return ApiRespone.<UserRespone>builder().result(userService.loginByEmail(request)).build();
	}

	/**
	 * Endpoint to issue a new access token using a valid refresh token.
	 *
	 * @param refreshRequest Object containing the refresh token.
	 * @return An object containing a new access token and the old refresh token.
	 */
	@PostMapping("/refreshUser")
	@Operation(summary = "Refresh User", description = "Refresh user")
	public ApiRespone<UserRespone> refreshUser(@RequestBody String token) {
		try {
			return ApiRespone.<UserRespone>builder().result(userService.refreshUser(token)).build();
		} catch (AppException e) {
			logger.warn("Business error during refresh User: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			logger.error("System error during refresh User: {}", e.getMessage(), e);
			throw e;
		}
	}

	/**
	 * Cập nhật avatar cho người dùng.
	 *
	 * @param image Ảnh đại diện mới (Multipart).
	 * @param email Email người dùng cần cập nhật avatar.
	 * @return Thông tin người dùng sau khi cập nhật avatar.
	 */
	@PostMapping(value = "/uploadAvatar", consumes = { "multipart/form-data" })
	@Operation(summary = "Cập nhật avatar người dùng", description = "Tải ảnh đại diện mới cho người dùng theo email.")
	public ApiRespone<UserRespone> uploadAvatar(@RequestParam MultipartFile image, @RequestParam String email)
			throws IOException {
		return ApiRespone.<UserRespone>builder().result(userService.uploadUser(image, email)).build();
	}

	/**
	 * Cập nhật thông tin người dùng.
	 *
	 * @param request Thông tin cập nhật.
	 * @return Thông tin người dùng sau khi cập nhật.
	 */
	@PutMapping(value = "/updateUser")
	@Operation(summary = "Cập nhật thông tin người dùng", description = "Chỉnh sửa thông tin của người dùng.")
	public ApiRespone<UserRespone> updateUser(@RequestBody UserUpdateRequest request) throws IOException {
		return ApiRespone.<UserRespone>builder().result(userService.updateUser(request)).build();
	}

	/**
	 * Cập nhật password người dùng
	 */
	@PutMapping(value = "/forgotPass")
	@Operation(summary = "Cập nhật password người dùng", description = "Dùng khi quên mật khẩu")
	public ApiRespone<UserRespone> updateUser(@RequestBody UserForgotPasswordRequest request) throws IOException {
		JsonSchemaValidator.validate(request, "UserUpdatePasswordSchema.json");
		return ApiRespone.<UserRespone>builder().result(userService.updatePasswordUser(request)).build();
	}

	/**
	 * Lấy Id User bằng email truyền vào
	 * 
	 * @param email
	 * @return
	 * @throws IOException
	 */
	@GetMapping("/getId")
	@Operation(summary = "Lấy Id User", description = "Lấy Id User bằng email truyền vào")
	public ApiRespone<String> getIdUser(@RequestParam String email) throws IOException {
		return ApiRespone.<String>builder().result(userService.getIdUser(email)).build();
	}

	/**
	 * Xoá người dùng khỏi hệ thống theo ID.
	 *
	 * @param idUser ID người dùng cần xoá.
	 * @return Chuỗi thông báo xoá thành công.
	 */
	@DeleteMapping("/deleteUser")
	@Operation(summary = "Xoá người dùng", description = "Xoá người dùng theo ID.")
	public ApiRespone<String> deleteUser(@RequestParam String idUser) {
		return ApiRespone.<String>builder().result(userService.deleteUser(idUser)).build();
	}

	@PutMapping("/updateHistoryDeposit")
	public ApiRespone<HistoryDepositRespone> updateHistoryDeposit(@RequestBody HistoryDepositUpdateRequest request) {
		return ApiRespone.<HistoryDepositRespone>builder().result(
				historyDepositService.updateHistoryDeposit(request.getIdHistoryDeposit(), request.getStatusDeposit()))
				.build();
	}

	/**
	 * Tạo mới lịch sử đọc truyện của người dùng.
	 *
	 * @param readRequest Thông tin chương đọc bao gồm email, ID truyện, tiêu đề
	 *                    chương.
	 * @return Thông tin người dùng sau khi thêm lịch sử đọc.
	 */
	@PostMapping("/createHistory")
	@Operation(summary = "Thêm lịch sử đọc chương truyện", description = "Tạo lịch sử đọc chương truyện theo email, ID truyện và tiêu đề chương.")
	public ApiRespone<UserRespone> createHistory(@RequestBody CreateHistoryReadRequest readRequest) {
		return ApiRespone.<UserRespone>builder().result(userService.createHistoryRead(readRequest)).build();
	}

	/**
	 * Xoá lịch sử đọc của người dùng dựa trên đối tượng HistoryId.
	 *
	 * @param historyId Đối tượng bao gồm idUser và idChapter.
	 * @return Chuỗi thông báo xoá thành công.
	 */
	@DeleteMapping("/deleteHistory")
	@Operation(summary = "Xoá lịch sử đọc", description = "Xoá lịch sử đọc truyện theo đối tượng HistoryId.")
	public ApiRespone<String> deleteHistory(@RequestBody HistoryId historyId) {
		return ApiRespone.<String>builder().result(historyReadService.deleteHistoryRead(historyId)).build();
	}

	/**
	 * Lấy danh sách chương đã đọc của người dùng theo ID.
	 *
	 * @param idUser ID người dùng.
	 * @return Danh sách các chương truyện đã đọc.
	 */
	@GetMapping("/getHistory")
	@Operation(summary = "Lấy lịch sử đọc", description = "Trả về danh sách các chương truyện đã đọc của người dùng theo ID.")
	public ApiRespone<List<HistoryReadNovelRespone>> getHistory(@RequestParam String idUser) {
		return ApiRespone.<List<HistoryReadNovelRespone>>builder().result(historyReadService.getHistoryRead(idUser))
				.build();
	}

	/**
	 * Cấp quyền "MANAGER" cho tài khoản người dùng.
	 *
	 * @param idUser ID của người dùng cần cấp quyền.
	 * @return Thông tin người dùng sau khi được cấp quyền mới và token mới.
	 */
	@PutMapping(value = "/grantRole/{idUser}")
	@Operation(summary = "Trao quyền manager cho tài khoản", description = "Nhập id User dạng string, nó sẽ kiếm thấy thì thao quyền manager không thấy thì báo ko tìm thấy, token được trả về là token mới có role mới")
	ApiRespone<UserRespone> grantRole(@PathVariable String idUser) {
		return ApiRespone.<UserRespone>builder().result(userService.grantRole(idUser)).build();
	}

	/**
	 * Tạo mới một đánh giá cho tiểu thuyết.
	 *
	 * @param request Thông tin của đánh giá cần tạo, bao gồm ID tiểu thuyết, ID
	 *                người dùng, nội dung, và điểm đánh giá.
	 * @return Thông tin đánh giá vừa được tạo.
	 */
	@PostMapping("/createReviewNovel")
	@Operation(summary = "Tạo mới đánh giá tiểu thuyết", description = "Truyền vào thông tin đánh giá (bao gồm ID tiểu thuyết, ID người dùng, nội dung đánh giá và điểm số). Hệ thống sẽ tạo mới một đánh giá cho tiểu thuyết đó.")
	ApiRespone<ReviewNovelRespone> createReviewNovel(@RequestBody ReviewNovelCreationRequest request) {
		return ApiRespone.<ReviewNovelRespone>builder().result(reviewNovelService.createReviewNovel(request)).build();
	}

	/**
	 * Xóa một đánh giá tiểu thuyết dựa trên ID đánh giá.
	 *
	 * @param reviewNovelId Thông tin ID đánh giá cần xóa (bao gồm ID người dùng và
	 *                      ID tiểu thuyết).
	 * @return ID của đánh giá đã được xóa.
	 */
	@DeleteMapping("/deleteReviewNovel")
	@Operation(summary = "Xóa đánh giá tiểu thuyết", description = "Truyền vào ReviewNovelId (bao gồm idUser và idNovel). Hệ thống sẽ xóa đánh giá tương ứng nếu tồn tại.")

	ApiRespone<ReviewNovelId> deleteReviewNovel(@RequestBody ReviewNovelId reviewNovelId) {
		return ApiRespone.<ReviewNovelId>builder().result(reviewNovelService.deleteReviewNovel(reviewNovelId)).build();
	}

	@PostMapping("/report")
	public ResponseEntity<?> remindUsersOfTasks(@RequestBody UserCreateReportRequest request) {
	    // Send WebSocket notification to user
		 messagingTemplate.convertAndSend("/topic/globalNotify", request);
		    return ResponseEntity.ok("Gửi message đến tất cả clients đăng ký topic.");
	}


	@GetMapping("/getAllHistoryDeposit")
	public ApiRespone<List<HistoryDepositGetAllRespone>> getAllHistoryDepotis(){
		return ApiRespone.<List<HistoryDepositGetAllRespone>>builder().result(historyDepositService.getAllHistoryDepositB()).build();
	}
	
}
