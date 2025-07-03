package com.example.demo.config;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * A helper component responsible for reading and parsing security configuration
 * from the {@link SecurityProperties} object (which is loaded from the application.yml file).
 * <p>
 * The main role of this class is to convert user-friendly string configurations
 * from the YAML file into data structures that {@link SecurityConfig} can directly use
 * to set up access control rules.
 * </p>
 */
@Component
public class RolePermissionResolver {

    private static final Logger logger = LoggerFactory.getLogger(RolePermissionResolver.class);

    /**
     * Object containing security properties loaded from the configuration file.
     */
    private final SecurityProperties properties;

    /**
     * Standard prefix used by Spring Security for roles.
     * This prefix will be prepended to each role name read from the configuration.
     */
    private static String ROLE_PREFIX = "ROLE_";

    /**
     * Constructor for Spring to inject the SecurityProperties bean.
     *
     * @param properties The bean containing security configurations.
     */
    public RolePermissionResolver(SecurityProperties properties) {
        this.properties = properties;
    }

    /**
     * Retrieves the list of publicly accessible (whitelisted) endpoints.
     *
     * @return A list of strings defining the whitelisted endpoints.
     */
    public List<String> getWhiteList() {
        return properties.getWhitelist();
    }

    /**
     * Parses the {@code app.security.endpoints} configuration from the YAML file
     * and converts it into a map from endpoint to the set of allowed roles.
     * <p>
     * Return structure: {@code Map<"METHOD:/path/pattern", Set<"ROLE_NAME">>}<br>
     * Example: Key = "GET:/project/**", Value = {"ROLE_MEMBER", "ROLE_MANAGER", "ROLE_ADMIN"}
     * </p>
     *
     * @return A processed map ready to be used by {@link SecurityConfig}.
     */
    public Map<String, Set<String>> getEnpointToRolesMap() {
        Map<String, Set<String>> endpointToRoles = new HashMap<>();
        Map<String, String> configureEndpoints = properties.getEndpoints();

        if (configureEndpoints == null) {
            return endpointToRoles;
        }

        // Iterate over each (path, permissionString) pair from the configuration
        for (Map.Entry<String, String> entry : configureEndpoints.entrySet()) {
            String path = entry.getKey();
            String permissionString = entry.getValue();

            // Split permission blocks by method (separated by ';')
            // Example: "GET:member; POST:manager" -> ["GET:member", "POST:manager"]
            String[] methodPermissions = permissionString.split("\\s*;\\s*");

            for (String methodPermission : methodPermissions) {
                // Split by ':' to separate methods and roles
                // Example: "GET,PUT:member,manager" -> ["GET,PUT", "member,manager"]
                String[] parts = methodPermission.split("\\s*:\\s*");
                if (parts.length != 2) {
                    logger.warn("Invalid permission format for path [{}]: {}", path, methodPermission);
                    continue;
                }

                // Split HTTP methods
                String[] methods = parts[0].toUpperCase().split("\\s*,\\s*");

                // Split role names
                String[] roles = parts[1].split("\\s*,\\s*");

                // For each method, create a complete endpoint key and map roles to it
                for (String method : methods) {
                    String endpointKey = method + ":" + path;

                    // Get or create the role set for this endpoint
                    Set<String> rolesForEndpoint = endpointToRoles.computeIfAbsent(endpointKey, k -> new HashSet<>());

                    // Add each role to the set, with "ROLE_" prefix and uppercase
                    for (String role : roles) {
                        rolesForEndpoint.add(ROLE_PREFIX + role.trim().toUpperCase());
                    }
                }
            }
        }

        logger.debug("Resolved Endpoint to Roles mapping: {}", endpointToRoles);
        return endpointToRoles;
    }
}
