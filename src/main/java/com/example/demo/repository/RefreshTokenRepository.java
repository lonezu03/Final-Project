package com.example.demo.repository;

import java.util.Date;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.RefreshToken;
import com.example.demo.entity.User;



/**
 * Repository interface to manage operations with the {@link RefreshToken}
 * entity.
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	/**
	 * Finds a RefreshToken based on its unique token string.
	 *
	 * @param token The token string to search for.
	 * @return An Optional containing the RefreshToken if found.
	 */
	Optional<RefreshToken> findByToken(String token);

	/**
	 * Deletes the RefreshToken of a specific user. This method is usually called
	 * when the user logs out or when a new token is generated.
	 *
	 * @param user The user whose token should be deleted.
	 * @return The number of records deleted.
	 */
	Long deleteByUser(User user);
	/**
	 * Finds a RefreshToken by its token string only if it has not expired.
	 *
	 * @param token The token string to search for.
	 * @param now The current date-time to compare with expiryDate.
	 * @return An Optional containing the valid RefreshToken if found and not expired.
	 */
	Optional<RefreshToken> findByTokenAndExpiryDateAfter(String token, Date now);

}
