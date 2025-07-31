package com.example.demo.config;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.demo.entity.Permission;
import com.example.demo.entity.RoleUser;
import com.example.demo.enums.Role;
import com.example.demo.repository.IPermissionRepository;
import com.example.demo.repository.IRoleUserRepository;
import com.example.demo.repository.RefreshTokenRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * A custom filter inserted into the Spring Security filter chain. The main task
 * of this filter is to perform additional validation: it checks whether the
 * Refresh Token associated with the Access Token in the request still exists
 * and is valid in the database.
 * <p>
 * This allows immediate invalidation of Access Tokens whose corresponding
 * Refresh Tokens have been revoked (e.g., after the user logs out).
 * </p>
 * Inherits from {@link OncePerRequestFilter} to ensure that the filter is
 * executed only once per request.
 */
@Component
public class TokenValidationFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(TokenValidationFilter.class);

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private IRoleUserRepository roleUserRepository;

	@Autowired
	private IPermissionRepository permissionRepository;

	@Autowired
	private JwtDecoder jwtDecoder;

	/**
	 * The main method of the filter, executed for every incoming request.
	 *
	 * @param request     The HTTP request object.
	 * @param response    The HTTP response object.
	 * @param filterChain The chain of remaining filters.
	 * @throws ServletException
	 * @throws IOException
	 */
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

//		String endPoint = convertToRegex(request.getRequestURI());
		String endPoint = normalizeEndpoint(request.getRequestURI());
//		logger.info(endPoint);
		List<Permission> permissions = permissionRepository.findByEndPointAndMethodWithRoles(endPoint,request.getMethod());
		Boolean isWhiteList=false;
		if (permissions != null && !permissions.isEmpty()) {
			for (Permission permission : permissions) {
				if (permission.isWhiteList()) {
					isWhiteList=true;
					break;
				}
			}
		}
		
		
		if (!isWhiteList) {
			List<RoleUser> roleUsers = roleUserRepository.findByRoleWithPermissions(Role.ADMIN);
			Permission permission = new Permission();
	  
			if (permissions == null || permissions.isEmpty()) {
				permission.setEndPoint(endPoint);
				permission.setWhiteList(false);
				permission.setMethod(request.getMethod());
				permission = permissionRepository.save(permission);
				for (RoleUser roleUser : roleUsers) {
					boolean isContain = roleUser.getPermissions().contains(permission);
					if (!isContain && permission != null) {
						roleUser.getPermissions().add(permission);
			            permission.getRoles().add(roleUser); // BẮT BUỘC CÓ
			            roleUserRepository.save(roleUser);
			            permissionRepository.save(permission); // BẮT BUỘC CÓ
					}
 
				}
			} else {
				for (RoleUser roleUser : roleUsers) {
					for (Permission permiss : permissions) {
						boolean isContain = roleUser.getPermissions().contains(permiss);
						if (!isContain) {
							roleUser.getPermissions().add(permiss);
			                permiss.getRoles().add(roleUser); // BẮT BUỘC CÓ
//			                logger.info("Enpoint: {}", permiss.getEndPoint());
			                roleUserRepository.save(roleUser);
			                permissionRepository.save(permiss); // BẮT BUỘC CÓ
						}
					}
				}
			}
		}

		// Get the authentication information processed by previous Spring Security
		// filters.
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		// Only proceed if the user is authenticated and is not anonymous.
		if (authentication != null && authentication.isAuthenticated()
				&& !(authentication instanceof AnonymousAuthenticationToken)) {

			// Extract the Access Token string from the 'Authorization' header.
			String tokenValue = extractTokenFromRequest(request);

			if (tokenValue != null) {
				try {
					// Decode the Access Token to access its claims.
					Jwt jwt = jwtDecoder.decode(tokenValue);

					// Retrieve the 'refreshToken' claim from the Access Token.
					String refreshTokenValue = jwt.getClaimAsString("refreshToken");
					String role=jwt.getClaimAsString("scope");
					Role roleEnum = Role.valueOf(role.toUpperCase());
					// IMPORTANT CHECK:
					// Verify if the refresh token exists in the database.
					// If the refreshToken claim is null or not found in DB,
					// it means it has been revoked (e.g., due to logout).
					if (refreshTokenValue == null || refreshTokenRepository.findByToken(refreshTokenValue).isEmpty()) {
						// Clear the security context to invalidate the session.
						SecurityContextHolder.clearContext();
						// Return a 401 Unauthorized error.
						response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
								"Invalid Token: Associated refresh token not found or has been revoked.");
						return; // Stop further request processing.
					}
					
					
						if (!roleUserRepository.existsByRoleAndEndPointAndMethod(roleEnum, endPoint,request.getMethod()) && !isWhiteList) {
							logger.info("Role {}",roleEnum);
							// Clear the security context to invalidate the session.
							SecurityContextHolder.clearContext();
							// Return a 401 Unauthorized error. 
							response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
									"User dont have this permission");
							return; // Stop further request processing.
						}
					
					
					if (!refreshTokenRepository.findByTokenAndExpiryDateAfter(tokenValue, new Date()).isPresent()) {

					}

				} catch (JwtException e) {
					// If there is a decoding error (e.g., expired or malformed token),
					// we can skip here as other Spring Security filters may handle it,
					// or we can log it for debugging.
					logger.warn("JWT validation failed in custom filter: {}", e.getMessage());
				}
			}
		}

		// If everything is fine, allow the request to continue through the filter
		// chain.
		filterChain.doFilter(request, response);
	}

	/**
	 * Helper method to extract the JWT token string from the request's
	 * 'Authorization' header.
	 *
	 * @param request The HttpServletRequest object.
	 * @return The JWT token string if found, otherwise null.
	 */
	public String extractTokenFromRequest(HttpServletRequest request) {
		// Get the 'Authorization' header value.
		String bearerToken = request.getHeader("Authorization");
		// Check if the header exists, has content, and starts with "Bearer ".
		if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
			// Return the token part (excluding "Bearer ").
			return bearerToken.substring(7);
		}
		return null;
	}

//	private String convertToRegex(String endpoint) {
//		// Chuyển /api/book/{id} => /api/book/[^/]+
//		return endpoint.replaceAll("\\{[^/]+}", "[^/]+");
//	}
	
	private String trimPathVariable(String uri) {
	    // VD: /rolePermission/whiteListPermission/3 => /rolePermission/whiteListPermission
	    String[] parts = uri.split("/");
	    if (parts.length > 0 && parts[parts.length - 1].matches("\\d+")) {
	        return uri.substring(0, uri.lastIndexOf("/"));
	    }
	    return uri;
	}

	public String normalizeEndpoint(String endpoint) {
	    // Regex: nếu đoạn cuối là UUID hoặc số thì thay thế bằng [^/]+
	    return endpoint.replaceAll("/([a-fA-F0-9\\-]{36}|\\d+)(?=$|/)", "/[^/]+");
	}

}
