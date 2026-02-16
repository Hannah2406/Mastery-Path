package com.masterypath.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI Service for generating paths, questions, and processing uploaded content.
 * Uses OpenAI API (configurable via OPENAI_API_KEY environment variable).
 */
@Service
public class AIService {
    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    
    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;
    
    @Value("${ai.enabled:true}")
    private boolean aiEnabled;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public AIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Generate a learning path from a description.
     * Returns a list of node names/descriptions that should be in the path.
     */
    public List<PathNodeSuggestion> generatePath(String description, String difficulty, Integer estimatedTimeMinutes) {
        if (!aiEnabled || openaiApiKey == null || openaiApiKey.isBlank()) {
            log.warn("AI is disabled or API key not configured. Returning default suggestions.");
            return getDefaultPathSuggestions(description);
        }
        
        try {
            String prompt = buildPathGenerationPrompt(description, difficulty, estimatedTimeMinutes);
            String response = callOpenAI(prompt);
            return parsePathResponse(response);
        } catch (Exception e) {
            log.error("Failed to generate path with AI", e);
            return getDefaultPathSuggestions(description);
        }
    }
    
    /**
     * Generate practice questions for a node/topic.
     */
    public List<QuestionSuggestion> generateQuestions(String topic, String difficulty, int count) {
        if (!aiEnabled || openaiApiKey == null || openaiApiKey.isBlank()) {
            log.warn("AI is disabled or API key not configured. Returning empty list.");
            return List.of();
        }
        
        try {
            String prompt = buildQuestionGenerationPrompt(topic, difficulty, count);
            String response = callOpenAI(prompt);
            return parseQuestionResponse(response);
        } catch (Exception e) {
            log.error("Failed to generate questions with AI", e);
            return List.of();
        }
    }
    
    /**
     * Generate similar questions when user gets answer wrong.
     */
    public List<QuestionSuggestion> generateSimilarQuestions(String originalQuestion, String topic, String errorType) {
        if (!aiEnabled || openaiApiKey == null || openaiApiKey.isBlank()) {
            return List.of();
        }
        
        try {
            String prompt = buildSimilarQuestionPrompt(originalQuestion, topic, errorType);
            String response = callOpenAI(prompt);
            return parseQuestionResponse(response);
        } catch (Exception e) {
            log.error("Failed to generate similar questions with AI", e);
            return List.of();
        }
    }
    
    /**
     * Extract text from uploaded image (OCR-like functionality).
     * For now, returns a placeholder. In production, integrate with OCR service.
     */
    public String extractTextFromImage(byte[] imageData) {
        // TODO: Integrate with OCR service (e.g. Tesseract, Google Vision API, AWS Textract)
        // For now, return placeholder
        log.warn("OCR not yet implemented. Returning placeholder.");
        return "[Text extraction from image not yet implemented. Please type your question manually.]";
    }
    
    /**
     * Extract text from PDF.
     */
    public String extractTextFromPDF(byte[] pdfData) {
        try {
            // PDFBox 3.x: use Loader.loadPDF(byte[])
            org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(pdfData);
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(document);
            document.close();
            return text;
        } catch (Exception e) {
            log.error("Failed to extract text from PDF", e);
            throw new RuntimeException("Failed to extract text from PDF: " + e.getMessage());
        }
    }
    
    /**
     * Convert typed text to handwritten style (placeholder for future implementation).
     */
    public byte[] convertToHandwritten(String text) {
        // TODO: Integrate with handwriting generation service
        // For now, return placeholder
        log.warn("Handwriting conversion not yet implemented.");
        return text.getBytes();
    }
    
    private String callOpenAI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o-mini");
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", "You are a helpful learning assistant that creates structured educational content."),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2000);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_API_URL, request, String.class);
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI API error: " + response.getStatusCode());
        }
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("choices").get(0).get("message").get("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }
    
    private String buildPathGenerationPrompt(String description, String difficulty, Integer estimatedTimeMinutes) {
        return String.format("""
            Generate a structured learning path based on this description: "%s"
            
            Difficulty: %s
            Estimated time: %d minutes
            
            Return a JSON array of learning nodes/skills. Each node should have:
            - name: short skill name (e.g., "Two Sum", "Basic Arithmetic")
            - description: what this skill teaches
            - category: category name (e.g., "Array", "Algebra")
            
            Format:
            [
              {"name": "Skill 1", "description": "...", "category": "Category1"},
              {"name": "Skill 2", "description": "...", "category": "Category2"}
            ]
            
            Generate 8-15 skills appropriate for the difficulty level. Order them logically (basics first).
            """, description, difficulty != null ? difficulty : "intermediate", 
            estimatedTimeMinutes != null ? estimatedTimeMinutes : 600);
    }
    
    private String buildQuestionGenerationPrompt(String topic, String difficulty, int count) {
        return String.format("""
            Generate %d practice questions for the topic: "%s"
            
            Difficulty: %s
            
            Return a JSON array. Each question should have:
            - problem_text: the question/problem statement
            - solution_text: the answer/solution
            - difficulty: 1-5 (1=easiest, 5=hardest)
            
            Format:
            [
              {"problem_text": "Question 1?", "solution_text": "Answer 1", "difficulty": 2},
              {"problem_text": "Question 2?", "solution_text": "Answer 2", "difficulty": 3}
            ]
            
            Make questions clear, educational, and appropriate for the difficulty level.
            """, count, topic, difficulty != null ? difficulty : "intermediate");
    }
    
    private String buildSimilarQuestionPrompt(String originalQuestion, String topic, String errorType) {
        return String.format("""
            The user got this question wrong: "%s"
            
            Topic: %s
            Error type: %s
            
            Generate 3 similar practice questions to help them learn. Questions should:
            - Cover the same concept but with different wording/numbers
            - Be slightly easier if error was CONCEPT, similar difficulty otherwise
            - Help reinforce understanding
            
            Return JSON array:
            [
              {"problem_text": "Similar question 1?", "solution_text": "Answer 1", "difficulty": 2},
              {"problem_text": "Similar question 2?", "solution_text": "Answer 2", "difficulty": 2},
              {"problem_text": "Similar question 3?", "solution_text": "Answer 3", "difficulty": 2}
            ]
            """, originalQuestion, topic, errorType);
    }
    
    private List<PathNodeSuggestion> parsePathResponse(String response) {
        try {
            // Try to extract JSON array from response
            String jsonArray = extractJsonArray(response);
            JsonNode array = objectMapper.readTree(jsonArray);
            List<PathNodeSuggestion> suggestions = new ArrayList<>();
            for (JsonNode node : array) {
                suggestions.add(new PathNodeSuggestion(
                    node.get("name").asText(),
                    node.has("description") ? node.get("description").asText() : "",
                    node.has("category") ? node.get("category").asText() : "General"
                ));
            }
            return suggestions;
        } catch (Exception e) {
            log.error("Failed to parse path response", e);
            return getDefaultPathSuggestions("");
        }
    }
    
    private List<QuestionSuggestion> parseQuestionResponse(String response) {
        try {
            String jsonArray = extractJsonArray(response);
            JsonNode array = objectMapper.readTree(jsonArray);
            List<QuestionSuggestion> questions = new ArrayList<>();
            for (JsonNode node : array) {
                questions.add(new QuestionSuggestion(
                    node.get("problem_text").asText(),
                    node.has("solution_text") ? node.get("solution_text").asText() : "",
                    node.has("difficulty") ? node.get("difficulty").asInt() : 2
                ));
            }
            return questions;
        } catch (Exception e) {
            log.error("Failed to parse question response", e);
            return List.of();
        }
    }
    
    private String extractJsonArray(String response) {
        // Try to find JSON array in response (may have markdown code blocks)
        int start = response.indexOf('[');
        int end = response.lastIndexOf(']') + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return "[]";
    }
    
    private List<PathNodeSuggestion> getDefaultPathSuggestions(String description) {
        // Fallback: return some generic suggestions
        return List.of(
            new PathNodeSuggestion("Introduction", "Get started with the basics", "General"),
            new PathNodeSuggestion("Core Concepts", "Learn fundamental concepts", "General"),
            new PathNodeSuggestion("Practice", "Apply what you learned", "General")
        );
    }
    
    public static class PathNodeSuggestion {
        private final String name;
        private final String description;
        private final String category;
        
        public PathNodeSuggestion(String name, String description, String category) {
            this.name = name;
            this.description = description;
            this.category = category;
        }
        
        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getCategory() { return category; }
    }
    
    public static class QuestionSuggestion {
        private final String problemText;
        private final String solutionText;
        private final int difficulty;
        
        public QuestionSuggestion(String problemText, String solutionText, int difficulty) {
            this.problemText = problemText;
            this.solutionText = solutionText;
            this.difficulty = difficulty;
        }
        
        public String getProblemText() { return problemText; }
        public String getSolutionText() { return solutionText; }
        public int getDifficulty() { return difficulty; }
    }
}
