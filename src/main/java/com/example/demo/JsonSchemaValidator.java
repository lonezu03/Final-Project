package com.example.demo;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;

import org.everit.json.schema.Schema;
import org.everit.json.schema.loader.SchemaClient;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.springframework.core.io.ClassPathResource;

import com.example.demo.config.ClasspathSchemaClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;



/**
 * This class is responsible for validating incoming requests against
 * a predefined JSON schema format.
 */
public class JsonSchemaValidator {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * This method accepts a generic object T and the name of the schema file.
     * It performs JSON Schema validation to ensure that the data structure of the object
     * matches the schema definition.
     *
     * @param <T>            the type of the object to validate
     * @param jsonData       the actual data to be validated
     * @param schemaFileName the name of the schema file (located in /resources/schema/)
     */
    public static <T> void validate(T jsonData, String schemaFileName) {
        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(jsonData);
            InputStream schemaStream;
            try {
                schemaStream = new ClassPathResource("schema/" + schemaFileName).getInputStream();
                JSONObject rawSchema = new JSONObject(new JSONTokener(schemaStream));

                SchemaClient client = new ClasspathSchemaClient();

                SchemaLoader loader = SchemaLoader.builder()
                        .schemaJson(rawSchema)
                        .resolutionScope("classpath:/schema/")
                        .schemaClient(client)
                        .build();

                Schema schema = loader.load().build();
                JSONObject jsonSubject = new JSONObject(jsonString);

                schema.validate(jsonSubject);
            } catch (IOException e) {
                throw new UncheckedIOException("Error reading schema or JSON data", e);
            }

        } catch (JsonProcessingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
