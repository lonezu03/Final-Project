package com.example.demo.config;

import java.util.Properties;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.servlet.LocaleResolver;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;


/**
 * Central configuration class for the application.
 * <p>
 * Responsible for defining and initializing important beans used
 * throughout the application, including mail configuration, JWT decoding,
 * and mapping tools.
 * </p>
 */
@Configuration
public class Config {

    // --- Properties loaded from application.properties/yml ---

    /**
     * The secret key used to sign and verify JWT signatures.
     * Loaded from the property {@code app.security.singer-key}.
     */
    @Value("${app.security.singer-key}")
    private String SIGNER_KEY;

    /**
     * SMTP server host for sending emails.
     */
    @Value("${spring.mail.host}")
    private String host;

    /**
     * SMTP server port.
     */
    @Value("${spring.mail.port}")
    private int port;

    /**
     * Login username (email) for SMTP server authentication.
     */
    @Value("${spring.mail.username}")
    private String username;

    /**
     * Password (often an app-specific password) for SMTP authentication.
     */
    @Value("${spring.mail.password}")
    private String password;

//    /**
//     * Defines a custom {@link JavaMailSender} bean for sending emails.
//     * <p>
//     * This bean is explicitly configured to override Spring Boot's auto-configuration,
//     * particularly for handling SSL/TLS issues in development environments.
//     * </p>
//     *
//     * @return a configured instance of {@link JavaMailSenderImpl}.
//     */
//    @Bean
//    public JavaMailSender javaMailSender() {
//        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
//        mailSender.setHost(host);
//        mailSender.setPort(port);
//        mailSender.setUsername(username);
//        mailSender.setPassword(password);
//
//        Properties props = mailSender.getJavaMailProperties();
//        props.put("mail.transport.protocol", "smtp");
//        props.put("mail.smtp.auth", "true");
//        props.put("mail.smtp.starttls.enable", "true");
//
//        // --- SSL CONFIGURATION (FOR DEV/TEST ONLY) ---
//        // These properties fix "Server is not trusted" or "PKIX path building failed" issues.
//        props.put("mail.smtp.ssl.trust", "*");
//        props.put("mail.smtp.ssl.checkserveridentity", "false");
//
//        // Enable debug mode to see detailed communication logs with the mail server.
//        // props.put("mail.debug", "true");
//
//        return mailSender;
//    }

    /**
     * Defines a {@link JwtDecoder} bean responsible for decoding and verifying JWT signatures.
     * This is a core part of the OAuth2 Resource Server configuration.
     *
     * @return a {@link NimbusJwtDecoder} configured with the secret key and HS512 algorithm.
     */
    @Bean
    JwtDecoder jwtDecoder() {
        // Create a secret key from the SIGNER_KEY string
        SecretKeySpec secretKeySpec = new SecretKeySpec(SIGNER_KEY.getBytes(), "HS512");
        // Return a decoder using the specified key and algorithm
        return NimbusJwtDecoder.withSecretKey(secretKeySpec).macAlgorithm(MacAlgorithm.HS512).build();
    }
    
    /**
     * Defines a Jackson {@link ObjectMapper} bean.
     * This is the main bean used to handle conversion between Java objects and JSON strings.
     * Declaring it as a bean allows global customization if needed.
     *
     * @return an instance of {@link ObjectMapper}.
     */
    @Bean
    public ObjectMapper objectMapper() {
    	ObjectMapper mapper = new ObjectMapper();
        // Đăng ký module để Jackson hiểu LocalDate, LocalDateTime,...
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // hoặc encoder khác tùy chọn
    }


    /**
     * Defines the {@link MessageSource} bean to handle i18n messages (e.g., validation errors).
     * Automatically detects files like errorMessages_vi.properties, errorMessages_en.properties, etc.
     *
     * @return a configured {@link ResourceBundleMessageSource}.
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("errorMessages"); // Automatically finds errorMessages_vi.properties, etc.
        source.setDefaultEncoding("UTF-8");  // Critical for reading Vietnamese properly
        source.setUseCodeAsDefaultMessage(true);
        return source;
    }
    

    /**
     * Defines a custom {@link LocaleResolver} bean to handle locale resolution manually.
     * 
     * This uses a user-defined {@code CustomLocaleResolver} which inspects the 
     * Accept-Language header and applies the following logic:
     * 
     * - If the value is exactly "vi" → use Vietnamese.
     * - If the value is exactly "en" → use English.
     * - For all other values (e.g., "en-US", "fr", missing, etc.) → fallback to Japanese ("ja").
     * 
     * This ensures consistent localization behavior even when clients send variant or no headers.
     *
     * @return a {@link LocaleResolver} implementation
     */
    @Bean
    public LocaleResolver localeResolver() {
        return new CustomLocaleResolver(); // Custom strategy to resolve locale based on Accept-Language
    }



}
