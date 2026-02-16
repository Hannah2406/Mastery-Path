package com.masterypath.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String firstError = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Invalid value")
            .findFirst()
            .orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("error", firstError));
    }
}
