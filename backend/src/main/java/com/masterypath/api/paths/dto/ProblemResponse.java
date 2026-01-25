package com.masterypath.api.paths.dto;

import com.masterypath.domain.model.Problem;

public class ProblemResponse {
    private Long id;
    private String problemText;
    private String solutionText;
    private Integer difficulty;

    public ProblemResponse() {}

    public ProblemResponse(Long id, String problemText, String solutionText, Integer difficulty) {
        this.id = id;
        this.problemText = problemText;
        this.solutionText = solutionText;
        this.difficulty = difficulty;
    }

    public static ProblemResponse from(Problem problem) {
        return new ProblemResponse(
            problem.getId(),
            problem.getProblemText(),
            problem.getSolutionText(),
            problem.getDifficulty()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProblemText() {
        return problemText;
    }

    public void setProblemText(String problemText) {
        this.problemText = problemText;
    }

    public String getSolutionText() {
        return solutionText;
    }

    public void setSolutionText(String solutionText) {
        this.solutionText = solutionText;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }
}
