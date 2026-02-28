package com.masterypath.api.ai.dto;

public class TestCaseResultDTO {
    private int index;
    private boolean passed;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private String error;  // stderr or runtime error

    public TestCaseResultDTO() {}

    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public String getActualOutput() { return actualOutput; }
    public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
