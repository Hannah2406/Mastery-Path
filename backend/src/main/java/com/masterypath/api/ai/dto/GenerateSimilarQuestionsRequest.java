package com.masterypath.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateSimilarQuestionsRequest {
    @NotBlank(message = "originalQuestion is required")
    private String originalQuestion;
    
    @NotBlank(message = "topic is required")
    private String topic;
    
    @NotBlank(message = "errorType is required")
    private String errorType; // EXECUTION, FORGOT, CONCEPT
    
    public String getOriginalQuestion() { return originalQuestion; }
    public void setOriginalQuestion(String originalQuestion) { this.originalQuestion = originalQuestion; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }
}
