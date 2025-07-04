package com.example.demo.service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.IntrospectRequest;
import com.example.demo.dto.respone.IntrospectRespone;
import com.example.demo.entity.User;
import com.example.demo.mapper.IChapterMapper;
import com.example.demo.repository.IChapterRepository;
import com.example.demo.repository.INovelRepository;
import com.example.demo.repository.IUserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthenticationService {
	
//	IUserRepository userRepository;

	@NonFinal
	@Value("${app.security.singer-key}")
	protected String SIGNER_KEY;
/**
 * Phân tích và kiểm tra tính hợp lệ của JWT token.
 * Kiểm tra chữ ký và thời gian hết hạn của token.
 *
 * @param request đối tượng chứa token cần kiểm tra
 * @return đối tượng IntrospectRespone cho biết token có hợp lệ hay không
 * @throws JOSEException nếu có lỗi trong quá trình xác thực chữ ký
 * @throws ParseException nếu token không đúng định dạng
 */
	public IntrospectRespone introspect(IntrospectRequest request) throws JOSEException, ParseException {
		var token = request.getToken();

		JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

		SignedJWT signedJWT = SignedJWT.parse(token);

		Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

		var verified = signedJWT.verify(verifier);

		return IntrospectRespone.builder()
							.Valid(verified && expiryTime.after(new Date()))
							.build();
	}
	/**
 * Sinh JWT token mới cho người dùng với thông tin gồm: email, username, vai trò, thời gian phát hành, thời gian hết hạn.
 *
 * @param user người dùng muốn cấp phát token
 * @return chuỗi token đã ký hợp lệ
 * @throws RuntimeException nếu có lỗi khi ký token
 */
	public String generateToken(User user) {

		JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

		JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
				.subject(user.getEmailUser())
				.issuer(user.getUserNameUser())
				.issueTime(new Date())
				.expirationTime(new Date(Instant.now().plus(5, ChronoUnit.HOURS).toEpochMilli()))
				.claim("scope", buildScope(user)).build();
		Payload payload = new Payload(jwtClaimsSet.toJSONObject());
		JWSObject jwsObject = new JWSObject(header, payload);

		try {
			jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
			return jwsObject.serialize();
		} catch (JOSEException e) {
			log.error("Cannot create token", e);
			throw new RuntimeException(e);
		}

	}
/**
 * Tạo chuỗi scope (phạm vi quyền hạn) từ vai trò của người dùng.
 *
 * @param user người dùng cần tạo scope
 * @return chuỗi scope được phân cách bằng dấu cách
 */
	private String buildScope(User user) {
		StringJoiner stringJoiner = new StringJoiner(" ");
		stringJoiner.add(user.getRole() + "");
		return stringJoiner.toString();
	}
}
