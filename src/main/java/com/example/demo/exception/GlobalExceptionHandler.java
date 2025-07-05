package com.example.demo.exception;

import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.example.demo.dto.respone.ApiRespone;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(value = Exception.class)
	ResponseEntity<ApiRespone> handlingRunTimeException(RuntimeException exception){
		ApiRespone apiRespone=ApiRespone.builder().build();
		
		apiRespone.setCode(ErrorCode.UNKNOW_ERROR.getCode());
		apiRespone.setMessage(ErrorCode.UNKNOW_ERROR.getMessage());
	    log.error("Exception occurred in class: " + exception.getClass().getName(), exception);
		return ResponseEntity.badRequest().body(apiRespone);
	}
	
	@ExceptionHandler(value = AppException.class)
	ResponseEntity<ApiRespone> handlingAppException(AppException exception){
		ErrorCode errorCode= exception.getErrorcode();
		ApiRespone apiRespone=ApiRespone.builder().build();
		
		apiRespone.setCode(errorCode.getCode());
		apiRespone.setMessage(errorCode.getMessage());
		
		return ResponseEntity.badRequest().body(apiRespone);
	}
	
	   @ExceptionHandler(PropertyReferenceException.class)
	    public ResponseEntity<ApiRespone> handlePropertyReferenceException(PropertyReferenceException ex) {
	        ApiRespone apiRespone = ApiRespone.builder()
	                .code(ErrorCode.INVALID_SORT_FIELD.getCode())
	                .message("Invalid sort field: " + ex.getPropertyName())
	                .build();

	        log.error("Invalid sort field: {}", ex.getPropertyName(), ex);
	        return ResponseEntity.badRequest().body(apiRespone);
	    }
	   
	   @ExceptionHandler(HttpMessageNotReadableException.class)
	   public ResponseEntity<ApiRespone> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
	       String detailedMessage = "Invalid JSON format in request body.";
	       
	       // Lấy chi tiết lỗi nếu có
	       Throwable rootCause = ex.getMostSpecificCause();
	       if (rootCause != null && rootCause.getMessage() != null) {
	           detailedMessage += " Details: " + rootCause.getMessage();
	       }

	       ApiRespone apiRespone = ApiRespone.builder()
	           .code(ErrorCode.INVALID_JSON.getCode())
	           .message(detailedMessage)
	           .build();

	       log.error("Malformed JSON request: {}", detailedMessage, ex);
	       return ResponseEntity.badRequest().body(apiRespone);
	   }
}
