package com.example.demo.service;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.RefreshToken;
import com.example.demo.entity.User;
import com.example.demo.exception.AppException;
import com.example.demo.exception.ErrorCode;
import com.example.demo.repository.IUserRepository;
import com.example.demo.repository.RefreshTokenRepository;

import lombok.experimental.NonFinal;


/**
 * Service responsible for managing the lifecycle of Refresh Tokens.
 * Includes creation, verification, retrieval, and deletion of refresh tokens.
 */
@Service
public class RefreshTokenService {

	@NonFinal
	@Value("${app.jwt.refresh-token-duration-ms}")
	private Long refreshTokenDurationMs;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private IUserRepository userRepository;

	private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);

	/**
	 * Create a new Refresh Token for a specific user. This logic ensures each
	 * user only has one refresh token at a time by deleting any old tokens
	 * before creating a new one.
	 *
	 * @param user The user for whom the refresh token is to be created.
	 * @return The newly created RefreshToken object saved in the database.
	 */
	@Transactional
	public RefreshToken createRefreshToken(User user) {
		try {
			refreshTokenRepository.deleteByUser(user);
			user.setRefreshToken(null);
			userRepository.save(user);
			refreshTokenRepository.flush();

			RefreshToken refreshToken = new RefreshToken();
			refreshToken.setUser(user);
			refreshToken.setExpiryDate(Date.from(Instant.now().plusMillis(refreshTokenDurationMs)));
			refreshToken.setToken(UUID.randomUUID().toString());

			return refreshTokenRepository.save(refreshToken);
		} catch (AppException e) {
			logger.warn("Business logic error when creating refresh token: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			logger.error("System error when creating refresh token: {}", e.getMessage(), e);
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

	/**
	 * Find a Refresh Token in the database based on the token string.
	 *
	 * @param token The token string to search for.
	 * @return The corresponding RefreshToken object.
	 * @throws AppException if the token does not exist.
	 */
	public RefreshToken getByToken(String token) {
		try {
			return refreshTokenRepository.findByToken(token)
					.orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_EXISTS));
		} catch (AppException e) {
			logger.warn("Business logic error when retrieving refresh token by token string: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			logger.error("System error when retrieving refresh token by token string: {}", e.getMessage(), e);
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

	/**
	 * Verify a Refresh Token. Checks whether the token is still valid.
	 * If expired, the token will be deleted from the database and null is returned.
	 *
	 * @param refreshToken The RefreshToken object to verify.
	 * @return The RefreshToken object if still valid; otherwise null.
	 */
	public RefreshToken verifiedRefreshToken(RefreshToken refreshToken) {
		try {
			if (refreshToken.getExpiryDate().compareTo(Date.from(Instant.now())) < 0) {
				refreshTokenRepository.delete(refreshToken);
				return null;
			}
			return refreshToken;
		} catch (Exception e) {
			logger.error("Error while verifying refresh token expiration: {}", e.getMessage(), e);
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

	/**
	 * Delete a user's Refresh Token, usually used when a user logs out.
	 *
	 * @param idUser ID of the user whose refresh token should be deleted.
	 * @throws AppException if the user does not exist.
	 */
	@Transactional
	public void deleteRefreshTokenByIdUser(String idUser) {
		try {
			User user = userRepository.findById(idUser).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

			if (user.getRefreshToken() != null) {
				user.setRefreshToken(null);
				userRepository.save(user);
			}else {
				throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_EXISTS);
			}
		} catch (AppException e) {
			logger.warn("Business logic error when deleting refresh token for user: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			logger.error("Unknown error when deleting refresh token for user id {}: {}", idUser, e.getMessage(), e);
			throw new AppException(ErrorCode.UNKNOW_ERROR);
		}
	}

}
