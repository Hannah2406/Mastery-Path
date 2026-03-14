package com.masterypath.api.paths.dto;

public class GenerateNodeQuestionsRequest {
    private String pathName;
    private Integer count;
    private String difficulty;

    public String getPathName() { return pathName; }
    public void setPathName(String pathName) { this.pathName = pathName; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}
