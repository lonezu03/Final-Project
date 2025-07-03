package com.example.demo.config;

import java.io.InputStream;
import java.net.URI;
import java.nio.file.Paths;

import org.everit.json.schema.loader.SchemaClient;
import org.springframework.core.io.ClassPathResource;

/**
 * A custom implementation of the {@link SchemaClient} interface.
 * <p>
 * This class is designed to address a specific issue with the {@code everit-json-schema} library:
 * how to load referenced schema files ($ref) from within the application's classpath
 * instead of from a network URL or an absolute file path.
 * </p>
 * <p>
 * When the {@code SchemaLoader} encounters a reference such as {@code "$ref": "common-definitions.json"},
 * it will use this client to locate and read the file {@code common-definitions.json} from the
 * {@code /resources/schema/} directory in the application's classpath.
 * </p>
 */
public class ClasspathSchemaClient implements SchemaClient {

    /**
     * The main method invoked by {@code SchemaLoader} when it needs to resolve a URI from a $ref.
     * <p>
     * This logic extracts the file name from the given URL, then searches for the file
     * in the {@code /schema/} directory within the classpath, and returns an {@link InputStream}
     * so that the SchemaLoader can read the content.
     * </p>
     *
     * @param url The URI string defined in the {@code $ref} attribute of the schema.
     *            Example: "file:///path/to/project/target/classes/schema/common-definitions.json"
     * @return an {@link InputStream} of the located schema file.
     * @throws RuntimeException if the schema file cannot be found or an error occurs
     *                          during the path resolution process.
     */
    @Override
    public InputStream get(String url) {
        try {
            // Extract the file name from the URL.
            String fileName = Paths.get(new URI(url).getPath()).getFileName().toString();
            // Build the relative path within the classpath and open the input stream.
            // Assumes that all referenced schema files are located under the "schema/" directory.
            return new ClassPathResource("schema/" + fileName).getInputStream();
        } catch (Exception e) {
            // Wrap the original exception in a RuntimeException to provide clearer error info.
            throw new RuntimeException("Could not resolve schema reference from URL: " + url, e);
        }
    }
}
