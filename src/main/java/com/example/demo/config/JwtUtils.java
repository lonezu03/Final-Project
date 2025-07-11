package com.example.demo.config;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.demo.entity.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;

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
	
	public String generateToken(User user,String refreshToken) {

		JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

		JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
				.subject(user.getEmailUser())
				.issuer(user.getUserNameUser())
				.issueTime(new Date())
//				.expirationTime(new Date(Instant.now().plus(5, ChronoUnit.HOURS).toEpochMilli()))
				.expirationTime(new Date(Instant.now().plus(5, ChronoUnit.MILLIS).toEpochMilli()))

				.claim("scope", buildScope(user))
				.claim("refreshToken", refreshToken)
				.build();
		Payload payload = new Payload(jwtClaimsSet.toJSONObject());
		JWSObject jwsObject = new JWSObject(header, payload);

		try {
			jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
			return jwsObject.serialize();
		} catch (JOSEException e) {
			logger.error("Cannot create token", e);
			throw new RuntimeException(e);
		}
	}
	private String buildScope(User user) {
		StringJoiner stringJoiner = new StringJoiner(" ");
		stringJoiner.add(user.getRole() + "");
		return stringJoiner.toString();
	}
}
