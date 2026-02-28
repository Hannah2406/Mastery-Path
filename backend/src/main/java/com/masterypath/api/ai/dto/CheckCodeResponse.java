package com.masterypath.api.ai.dto;

import java.util.List;

public class CheckCodeResponse {
    private int passed;
    private int failed;
    private int total;
    private List<TestCaseResultDTO> results;
    private String aiFeedback;

    public CheckCodeResponse() {}

    public CheckCodeResponse(int passed, int failed, int total, List<TestCaseResultDTO> results, String aiFeedback) {
        this.passed = passed;
        this.failed = failed;
        this.total = total;
        this.results = results;
        this.aiFeedback = aiFeedback;
    }

    public int getPassed() { return passed; }
    public void setPassed(int passed) { this.passed = passed; }
    public int getFailed() { return failed; }
    public void setFailed(int failed) { this.failed = failed; }
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public List<TestCaseResultDTO> getResults() { return results; }
    public void setResults(List<TestCaseResultDTO> results) { this.results = results; }
    public String getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }
}
