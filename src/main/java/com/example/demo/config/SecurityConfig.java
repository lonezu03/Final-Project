package com.example.demo.config;

import java.util.Collection;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Central configuration class for Spring Security.
 * <p>
 * Responsible for defining the security filter chain, configuring JWT authentication,
 * and applying role-based access control rules to endpoints.
 * </p>
 * {@code @EnableWebSecurity} enables Spring's web security support.
 * {@code @EnableMethodSecurity} allows using security annotations at the method level.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

//    @Autowired
//    private TokenValidationFilter tokenValidationFilter;

    /**
     * Defines the {@link SecurityFilterChain} bean, the core of security configuration.
     * This method sets up the entire request processing logic, including CORS, JWT authentication,
     * and fine-grained access control.
     *
     * @param httpSecurity The main builder for security configuration.
     * @param resolver     A helper component that reads and parses permission rules from configuration files.
     * @param decoder      A bean responsible for decoding and verifying JWT signatures.
     * @return A fully configured {@link SecurityFilterChain}.
     * @throws Exception if an error occurs during configuration.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity, RolePermissionResolver resolver, JwtDecoder decoder)
            throws Exception {

        // CORS configuration
        httpSecurity.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // Configure the app as a Resource Server using JWT authentication
        httpSecurity.oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(decoder)
                .jwtAuthenticationConverter(jwtAuthenticationConverter())));

        // Insert custom TokenValidationFilter after Spring’s default Bearer token filter
//        httpSecurity.addFilterAfter(tokenValidationFilter, BearerTokenAuthenticationFilter.class);

        // Configure authorization rules
        httpSecurity.authorizeHttpRequests(auth -> {
            // 1. WHITELIST configuration: endpoints accessible without authentication
            for (String endpoint : resolver.getWhiteList()) {
                String[] parts = endpoint.split(":", 2);
                auth.requestMatchers(HttpMethod.valueOf(parts[0]), parts[1]).permitAll();
            }

            // 2. Dynamic role-based permission configuration from YAML
            Map<String, Set<String>> endpointToRoles = resolver.getEnpointToRolesMap();

            logger.info("--- CONFIGURING ENDPOINT PERMISSIONS FROM YAML ---");
            for (Map.Entry<String, Set<String>> entry : endpointToRoles.entrySet()) {
                String[] endpointParts = entry.getKey().split(":", 2);
                HttpMethod method = HttpMethod.valueOf(endpointParts[0]);
                String path = endpointParts[1];
                String[] roles = entry.getValue().toArray(new String[0]);

                logger.info("Mapping [{} {}] -> Roles: {}", method, path, roles);
                auth.requestMatchers(method, path).hasAnyAuthority(roles);
            }
            logger.info("--- FINISHED CONFIGURING ENDPOINT PERMISSIONS ---");

            // 3. Catch-all rule: Any other request requires authentication
            auth.anyRequest().authenticated();
        });

        // Disable CSRF protection (commonly disabled for stateless token-based APIs)
        httpSecurity.csrf(AbstractHttpConfigurer::disable);
      
        return httpSecurity.build();
    }

    /**
     * Defines a bean to convert JWT claims into GrantedAuthority objects
     * that Spring Security can understand.
     *
     * @return A configured JwtAuthenticationConverter.
     */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = jwtGrantedAuthoritiesConverter.convert(jwt);
            return authorities;
        });

        return jwtAuthenticationConverter;
    }

    /**
     * Defines a bean to configure Cross-Origin Resource Sharing (CORS).
     * Allows requests from different origins (e.g., frontend apps) to access this API.
     *
     * @return A configured UrlBasedCorsConfigurationSource.
     */
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
