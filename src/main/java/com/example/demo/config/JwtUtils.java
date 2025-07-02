package com.example.demo.config;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {
	Logger logger = LoggerFactory.getLogger(JwtUtils.class);

	@Value("${app.security.singer-key}")
	private String SIGNER_KEY;

	public boolean validateToken(String token) {
		try {
			logger.info("Checking JWT validity...");
			getClaims(token);
			return true;
		} catch (Exception e) {
			logger.info("❌ Invalid JWT: " + e.getMessage());
			return false;
		}
	}

	public String getUsernameFromToken(String token) {
		String email = getClaims(token).getSubject();
		logger.info("Email extracted from token: " + email);
		return email; // `sub` contains email
	}

	public Claims getClaims(String token) {
		try {
			SecretKey key = Keys.hmacShaKeyFor(SIGNER_KEY.getBytes(StandardCharsets.UTF_8));

			JwtParser parser = Jwts.parserBuilder().setSigningKey(key).build();

			return parser.parseClaimsJws(token).getBody();

		} catch (Exception e) {
			logger.error("❌ Error parsing token: {}", e.getMessage(), e);
			return null;
		}
	}
}
