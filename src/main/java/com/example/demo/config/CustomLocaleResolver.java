package com.example.demo.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.LocaleResolver;

import java.util.*;

/**
 * Custom implementation of {@link LocaleResolver} to determine the locale
 * from the Accept-Language header. Only supports Vietnamese ("vi") and English ("en")
 * explicitly. If other values are provided (e.g., "en-US", "fr", or no header),
 * it defaults to Japanese ("ja").
 */
public class CustomLocaleResolver implements LocaleResolver {
    private static final Logger logger = LoggerFactory.getLogger(CustomLocaleResolver.class);

    // Default locale to fall back to when input is unsupported
    private static final Locale DEFAULT_LOCALE = new Locale("ja");

    /**
     * Resolve the locale based on the Accept-Language header.
     *
     * @param request  the HTTP servlet request
     * @return the resolved locale (vi, en, or default ja)
     */
    @Override
    public Locale resolveLocale(HttpServletRequest request) {
        String headerLang = request.getHeader("Accept-Language");

        if (headerLang == null || headerLang.isBlank()) {
        	logger.info("No Accept-Language provided → fallback to: ja");
            return DEFAULT_LOCALE;
        }

        // Get the primary language from the header, ignoring country and quality values
        String language = headerLang.split(",")[0].strip().toLowerCase();

        // Accept only "vi" or "en" explicitly
        if (language.equals("vi")) {
        	logger.info("Language: vi → Using Vietnamese");
            return new Locale("vi");
        } else if (language.equals("en")) {
        	logger.info("Language: en → Using English");
            return new Locale("en");
        }

        // Fallback for any other variant like "en-US", "fr", etc.
        logger.info("Unsupported or non-standard language → fallback to: ja");
        return DEFAULT_LOCALE;
    }

    /**
     * Not implemented because locale switching during a request is not required.
     */
    @Override
    public void setLocale(HttpServletRequest request, HttpServletResponse response, Locale locale) {
        // Not needed for this resolver
    }

}
