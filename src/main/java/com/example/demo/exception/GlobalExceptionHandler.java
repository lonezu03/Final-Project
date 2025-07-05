package com.example.demo.exception;

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
	   
}
