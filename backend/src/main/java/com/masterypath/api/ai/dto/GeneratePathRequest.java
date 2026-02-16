package com.masterypath.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class GeneratePathRequest {
    @NotBlank(message = "description is required")
    private String description;
    
    private String difficulty; // beginner, intermediate, advanced
    private Integer estimatedTimeMinutes;
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Integer getEstimatedTimeMinutes() { return estimatedTimeMinutes; }
    public void setEstimatedTimeMinutes(Integer estimatedTimeMinutes) { this.estimatedTimeMinutes = estimatedTimeMinutes; }
}
