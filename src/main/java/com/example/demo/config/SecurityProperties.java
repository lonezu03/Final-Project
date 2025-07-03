package com.example.demo.config;

import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * A configuration class used to bind custom security-related properties
 * from the {@code application.yml} (or {@code .properties}) file into Java objects.
 * <p>
 * The annotation {@code @ConfigurationProperties(prefix = "app.security")} indicates
 * that this class maps to properties prefixed with "app.security".
 * </p>
 * This class serves as a "contract" defining what configurations are supported by the application.
 */
@Configuration
@ConfigurationProperties(prefix = "app.security")
@Data
public class SecurityProperties {

    /**
     * A list of publicly accessible endpoints that do not require authentication.
     * <p>
     * Each string in this list should follow the format: {@code "METHOD:ANT_PATH_PATTERN"}.
     * Example: {@code "GET:/v3/api-docs/**"}
     * </p>
     * Mapped from the property {@code app.security.whitelist} in the YAML file.
     */
    private List<String> whitelist;

    /**
     * A Map defining access permissions for each endpoint or endpoint pattern.
     * <p>
     * - **Key**: A string representing the API path, which can use wildcard `/**`.
     *   Example: {@code "/project/**"}
     * - **Value**: A string describing method-role permissions in the format:
     *   {@code "METHOD1,METHOD2:role1,role2; METHOD3:role3"}
     *   Example: {@code "GET:member,manager; POST,PUT:manager; DELETE:admin"}
     * </p>
     * Mapped from the property {@code app.security.endpoints} in the YAML file.
     */
    private Map<String, String> endpoints;
}
