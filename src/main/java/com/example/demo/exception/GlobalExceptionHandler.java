package com.example.demo.exception;

import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.everit.json.schema.ValidationException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.example.demo.dto.respone.ApiRespone;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(value = Exception.class)
	public ResponseEntity<ApiRespone> handlingRunTimeException(RuntimeException exception, HttpServletRequest request) {
	    String endpoint = request.getRequestURI();
	    String className = exception.getClass().getName();

	    ApiRespone apiRespone = ApiRespone.builder()
	            .code(ErrorCode.UNKNOW_ERROR.getCode())
	            .message("Unknown error occurred at endpoint: " + endpoint)
	            .build();

	    log.error("Unhandled exception at [{}] in class [{}]: {}", endpoint, className, exception.getMessage(), exception);

	    return ResponseEntity.badRequest().body(apiRespone);
	}

	
	@ExceptionHandler(value = AppException.class)
	public ResponseEntity<ApiRespone> handlingAppException(AppException exception, HttpServletRequest request) {
	    ErrorCode errorCode = exception.getErrorcode();

	    String endpoint = request.getRequestURI();
	    String message = errorCode.getMessage() + " at endpoint: " + endpoint;

	    ApiRespone apiRespone = ApiRespone.builder()
	            .code(errorCode.getCode())
	            .message(message)
	            .build();

	    log.warn("AppException at [{}] - Code: {}, Message: {}", endpoint, errorCode.getCode(), errorCode.getMessage(), exception);

	    return ResponseEntity.badRequest().body(apiRespone);
	}
	
	   @ExceptionHandler(PropertyReferenceException.class)
	    public ResponseEntity<ApiRespone> handlePropertyReferenceException(PropertyReferenceException ex,HttpServletRequest request) {
		   String endpoint = request.getRequestURI();
		    String message = "Invalid sort field: " + ex.getPropertyName() + " at endpoint: " + endpoint;

		   
	        ApiRespone apiRespone = ApiRespone.builder()
	                .code(ErrorCode.INVALID_SORT_FIELD.getCode())
	                .message(message)
	                .build();

	        log.error("Invalid sort field: {}", ex.getPropertyName(), ex);
	        return ResponseEntity.badRequest().body(apiRespone);
	    }
	   
	   @ExceptionHandler(HttpMessageNotReadableException.class)
	   public ResponseEntity<ApiRespone> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,HttpServletRequest request) {
	       
		   String endpoint = request.getRequestURI();
		    String message = "Invalid JSON format in request body at endpoint: " + endpoint;
		    String detailedMessage = "The JSON payload is malformed or contains invalid syntax.";
		    
		    
	       // Lấy chi tiết lỗi nếu có
	       Throwable rootCause = ex.getMostSpecificCause();
	       if (rootCause != null && rootCause.getMessage() != null) {
	           detailedMessage += " Details: " + rootCause.getMessage();
	       }

	       ApiRespone apiRespone = ApiRespone.builder()
	           .code(ErrorCode.INVALID_JSON.getCode())
	           .message(message+"\n"+detailedMessage)
	           .build();

	       log.error("Malformed JSON request: {}", detailedMessage, ex);
	       return ResponseEntity.badRequest().body(apiRespone);
	   }
	   
	   @ExceptionHandler(ValidationException.class)
	   public ResponseEntity<ApiRespone> handleJsonSchemaValidationException(
	           ValidationException ex,
	           HttpServletRequest request
	   ) {
	       String endpoint = request.getRequestURI();
	       String message = "JSON Schema validation failed at endpoint: " + endpoint;

	       // Lấy chi tiết lỗi nếu có
	       if (ex.getMessage() != null) {
	           message += ". Details: " + ex.getMessage();
	       }

	       ApiRespone apiRespone = ApiRespone.builder()
	           .code(ErrorCode.INVALID_JSON_SCHEMA.getCode())
	           .message(message)
	           .build();

	       log.warn("Validation failed at [{}]: {}", endpoint, ex.getMessage(), ex);
	       return ResponseEntity.badRequest().body(apiRespone);
	   }
	   
	   @ExceptionHandler(UncheckedIOException.class)
	   public ResponseEntity<ApiRespone> handleUncheckedIOException(UncheckedIOException ex, HttpServletRequest request) {
	       String endpoint = request.getRequestURI();
	       String message = "Failed to read schema or JSON data at endpoint: " + endpoint;

	       if (ex.getCause() != null) {
	           message += ". Details: " + ex.getCause().getMessage();
	       }

	       ApiRespone apiRespone = ApiRespone.builder()
	               .code(ErrorCode.INVALID_JSON_SCHEMA.getCode()) // có thể tạo mã lỗi riêng nếu muốn
	               .message(message)
	               .build();

	       log.error("UncheckedIOException at [{}]: {}", endpoint, ex.getMessage(), ex);
	       return ResponseEntity.badRequest().body(apiRespone);
	   }

	   
//		/**
//		 * Handles JSON Schema validation exceptions. This method is triggered when a
//		 * {@link ValidationException} is thrown.
//		 *
//		 * @param ex the ValidationException related to JSON Schema validation.
//		 * @return a ResponseEntity with status 400 (Bad Request) and a body containing
//		 *         error details.
//		 */
//		@ExceptionHandler(ValidationException.class)
//		public ResponseEntity<Map<String, Object>> handleValidationException(ValidationException ex) {
//			List<String> errors = collectValidationErrors(ex);
//			Map<String, Object> body = new HashMap<>();
//			body.put("error", "Dữ liệu JSON không hợp lệ");
//			body.put("details", errors);
//			return ResponseEntity.badRequest().body(body);
//		}
//		
//		  /**
//	     * Helper method to collect all validation error messages from a
//	     * {@code ValidationException}. Since a ValidationException may contain nested
//	     * exceptions, this method recursively extracts all error messages.
//	     *
//	     * @param e the root ValidationException.
//	     * @return a list of formatted error messages.
//	     */
//		private List<String> collectValidationErrors(ValidationException e) {
//			List<String> errors = new ArrayList<>();
//			if (e.getCausingExceptions().isEmpty()) {
//				errors.add(formatErrorMessage(e));
//			} else {
//				for (ValidationException ve : e.getCausingExceptions()) {
//					errors.addAll(collectValidationErrors(ve));
//				}
//			}
//			return errors;
//		}
//		 /** 
//	     * Helper method to format a validation error message for better readability.
//	     * It extracts the field name from the "pointer to violation".
//	     *
//	     * @param e a single ValidationException instance.
//	     * @return a formatted error message.
//	     */
//	    private String formatErrorMessage(ValidationException e) {
//	        String pointer = e.getPointerToViolation(); // e.g., "/username"
//	        if (pointer == null || pointer.isEmpty()) {
//	            return e.getMessage();
//	        } else {
//	            return "Field `" + pointer.replace("/", "") + "`: " + e.getMessage();
//	        }
//	    }
}
