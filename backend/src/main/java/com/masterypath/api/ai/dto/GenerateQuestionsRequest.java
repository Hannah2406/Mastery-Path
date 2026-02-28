package com.masterypath.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateQuestionsRequest {
    @NotBlank(message = "topic is required")
    private String topic;
    
    private String difficulty;
    private Integer count; // default 5
    /** Optional: e.g. "AMC8" to use competition-style, harder prompts */
    private String pathName;
    
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public String getPathName() { return pathName; }
    public void setPathName(String pathName) { this.pathName = pathName; }
}
