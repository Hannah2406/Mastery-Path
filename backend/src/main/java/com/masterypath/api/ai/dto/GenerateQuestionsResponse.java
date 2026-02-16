package com.masterypath.api.ai.dto;

import java.util.List;

public class GenerateQuestionsResponse {
    private List<QuestionDTO> questions;
    
    public List<QuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDTO> questions) { this.questions = questions; }
    
    public static class QuestionDTO {
        private String problemText;
        private String solutionText;
        private int difficulty;
        
        public QuestionDTO(String problemText, String solutionText, int difficulty) {
            this.problemText = problemText;
            this.solutionText = solutionText;
            this.difficulty = difficulty;
        }
        
        public String getProblemText() { return problemText; }
        public void setProblemText(String problemText) { this.problemText = problemText; }
        public String getSolutionText() { return solutionText; }
        public void setSolutionText(String solutionText) { this.solutionText = solutionText; }
        public int getDifficulty() { return difficulty; }
        public void setDifficulty(int difficulty) { this.difficulty = difficulty; }
    }
}
