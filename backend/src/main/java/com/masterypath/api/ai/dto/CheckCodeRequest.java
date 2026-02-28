package com.masterypath.api.ai.dto;

import java.util.List;

public class CheckCodeRequest {
    private String problemStatement;
    private String code;
    private String language;  // e.g. "python", "javascript"
    private List<TestCaseDTO> testCases;  // optional; if empty, AI can generate

    public String getProblemStatement() { return problemStatement; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public List<TestCaseDTO> getTestCases() { return testCases; }
    public void setTestCases(List<TestCaseDTO> testCases) { this.testCases = testCases; }
}
