package com.masterypath.api.ai.dto;

public class TestCaseDTO {
    private String input;
    private String expectedOutput;

    public TestCaseDTO() {}

    public TestCaseDTO(String input, String expectedOutput) {
        this.input = input;
        this.expectedOutput = expectedOutput;
    }

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
}
