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
    private static final String CHAT_PATH = "/v1/chat/completions";

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.base-url:https://api.openai.com}")
    private String openaiBaseUrl;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

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
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured. Returning default suggestions.");
            return getDefaultPathSuggestions(description);
        }
        
        try {
            String prompt = buildPathGenerationPrompt(description, difficulty, estimatedTimeMinutes);
            String response = callAi(prompt);
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
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured. Returning empty list.");
            return List.of();
        }
        String prompt = buildQuestionGenerationPrompt(topic, difficulty, count);
        String response = callAi(prompt);
        return parseQuestionResponse(response);
    }
    
    /**
     * Generate similar questions when user gets answer wrong.
     */
    public List<QuestionSuggestion> generateSimilarQuestions(String originalQuestion, String topic, String errorType) {
        if (!aiEnabled || !hasAiKey()) {
            return List.of();
        }
        String prompt = buildSimilarQuestionPrompt(originalQuestion, topic, errorType);
        String response = callAi(prompt);
        return parseQuestionResponse(response);
    }
    
    /**
     * Extract text from uploaded image using OpenAI Vision API.
     */
    public String extractTextFromImage(byte[] imageData) {
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured. Cannot extract text from image.");
            return "[AI text extraction not available. Please type your answer manually.]";
        }
        
        try {
            String base64Image = java.util.Base64.getEncoder().encodeToString(imageData);
            String prompt = "Extract all text from this image. If it's handwritten, transcribe it accurately. Return only the text content, no explanations.";
            return callAiVision(prompt, base64Image);
        } catch (Exception e) {
            log.error("Failed to extract text from image", e);
            return "[Failed to extract text: " + e.getMessage() + "]";
        }
    }
    
    /**
     * Mark/evaluate a drawing using AI Vision API.
     * Returns feedback, score, and extracted text.
     */
    public MarkingResult markDrawing(byte[] imageData, String question) {
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured. Cannot mark drawing.");
            return new MarkingResult(null, "AI marking not available. Please ensure API key is set.", null);
        }
        
        try {
            String base64Image = java.util.Base64.getEncoder().encodeToString(imageData);
            String prompt = String.format("""
                You are a teacher marking a student's handwritten work.
                
                Question: %s
                
                Please:
                1. Extract and transcribe all handwritten text from the image
                2. Evaluate the answer for correctness, completeness, and clarity
                3. Provide a score out of 100
                4. Give constructive feedback
                
                Return a JSON object with:
                {
                  "extractedText": "the transcribed text",
                  "score": 85,
                  "feedback": "Your answer shows good understanding of X. However, you missed Y. Consider Z."
                }
                """, question != null && !question.isBlank() ? question : "General problem solving");
            
            String response = callAiVision(prompt, base64Image);
            return parseMarkingResponse(response);
        } catch (Exception e) {
            log.error("Failed to mark drawing", e);
            return new MarkingResult(null, "Failed to mark your work: " + e.getMessage(), null);
        }
    }
    
    /** Use Gemini vision if key set, otherwise OpenAI vision. */
    private String callAiVision(String prompt, String base64Image) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return callGeminiVision(prompt, base64Image);
        }
        if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            return callOpenAIVision(prompt, base64Image);
        }
        throw new RuntimeException("No AI API key configured for vision. Set GEMINI_API_KEY or OPENAI_API_KEY.");
    }

    private String callGeminiVision(String prompt, String base64Image) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(Map.of("parts", List.of(
            Map.of("text", prompt != null ? prompt : ""),
            Map.of("inlineData", Map.of("mimeType", "image/png", "data", base64Image))
        ))));
        body.put("generationConfig", Map.of("maxOutputTokens", 2000));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            String friendly = friendlyAiError(response.getStatusCode().value(), response.getBody());
            throw new RuntimeException(friendly != null ? friendly : "Gemini Vision API error: " + response.getStatusCode() + " " + (response.getBody() != null ? response.getBody() : ""));
        }
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            JsonNode candidates = json.get("candidates");
            if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini returned no candidates");
            }
            return candidates.get(0).get("content").get("parts").get(0).get("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini Vision response", e);
        }
    }

    private String callOpenAIVision(String prompt, String base64Image) {
        String url = openaiBaseUrl.replaceAll("/$", "") + "/v1/chat/completions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o");
        requestBody.put("messages", List.of(
            Map.of("role", "user", "content", List.of(
                Map.of("type", "text", "text", prompt),
                Map.of("type", "image_url", "image_url", Map.of("url", "data:image/png;base64," + base64Image))
            ))
        ));
        requestBody.put("max_tokens", 2000);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI Vision API error: " + response.getStatusCode());
        }

        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("choices").get(0).get("message").get("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI Vision response", e);
        }
    }
    
    private MarkingResult parseMarkingResponse(String response) {
        try {
            String jsonStr = extractJsonObject(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            String extractedText = json.has("extractedText") ? json.get("extractedText").asText() : null;
            Integer score = json.has("score") ? json.get("score").asInt() : null;
            String feedback = json.has("feedback") ? json.get("feedback").asText() : "No feedback provided.";
            return new MarkingResult(score, feedback, extractedText);
        } catch (Exception e) {
            log.error("Failed to parse marking response", e);
            return new MarkingResult(null, "AI provided feedback but couldn't parse score. Response: " + response.substring(0, Math.min(200, response.length())), null);
        }
    }
    
    private String extractJsonObject(String response) {
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return "{}";
    }
    
    public static class MarkingResult {
        private final Integer score;
        private final String feedback;
        private final String extractedText;
        
        public MarkingResult(Integer score, String feedback, String extractedText) {
            this.score = score;
            this.feedback = feedback;
            this.extractedText = extractedText;
        }
        
        public Integer getScore() { return score; }
        public String getFeedback() { return feedback; }
        public String getExtractedText() { return extractedText; }
    }
    
    /**
     * Check a submitted answer against the question (Submit mode: no live feedback, check on submit).
     */
    public CheckAnswerResult checkAnswer(String question, String answer) {
        if (!aiEnabled || !hasAiKey()) {
            return new CheckAnswerResult(false, 0, "AI is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY to use answer checking.");
        }
        if (answer == null || answer.isBlank()) {
            return new CheckAnswerResult(false, 0, "Please enter an answer before submitting.");
        }
        try {
            String prompt = String.format("""
                You are a teacher. Evaluate this student answer for the given question.
                Question: %s
                Student answer: %s
                Return ONLY a JSON object with:
                { "correct": true or false, "score": 0-100, "feedback": "brief constructive feedback" }
                """,
                question != null ? question : "General problem",
                answer);
            String response = callAi(prompt);
            return parseCheckAnswerResponse(response);
        } catch (Exception e) {
            log.error("Failed to check answer", e);
            return new CheckAnswerResult(false, 0, "Failed to check: " + e.getMessage());
        }
    }
    
    /**
     * Get live tutoring feedback on current work (Learning mode: AI gives advice as they type).
     */
    public String getLiveFeedback(String question, String answer) {
        if (!aiEnabled || !hasAiKey()) {
            return "AI is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY for live feedback.";
        }
        if (answer == null || answer.isBlank()) {
            return "Type or draw your answer above — I'll give hints and feedback as you go.";
        }
        try {
            String prompt = String.format("""
                You are a supportive tutor. The student is working on this problem live.
                Question: %s
                What they have so far: %s
                Give 1-3 short, actionable hints or feedback. Do NOT give the full answer. Be brief (1-3 sentences).
                """,
                question != null ? question : "General problem",
                answer);
            return callAi(prompt);
        } catch (Exception e) {
            log.error("Failed to get live feedback", e);
            return "Could not get feedback: " + e.getMessage();
        }
    }
    
    private CheckAnswerResult parseCheckAnswerResponse(String response) {
        try {
            String jsonStr = extractJsonObject(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            boolean correct = json.has("correct") && json.get("correct").asBoolean();
            int score = json.has("score") ? json.get("score").asInt() : 0;
            String feedback = json.has("feedback") ? json.get("feedback").asText() : "No feedback.";
            return new CheckAnswerResult(correct, score, feedback);
        } catch (Exception e) {
            return new CheckAnswerResult(false, 0, "Could not parse AI response.");
        }
    }
    
    public static class CheckAnswerResult {
        private final boolean correct;
        private final int score;
        private final String feedback;
        
        public CheckAnswerResult(boolean correct, int score, String feedback) {
            this.correct = correct;
            this.score = score;
            this.feedback = feedback != null ? feedback : "";
        }
        public boolean isCorrect() { return correct; }
        public int getScore() { return score; }
        public String getFeedback() { return feedback; }
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
    
    private boolean hasAiKey() {
        return (geminiApiKey != null && !geminiApiKey.isBlank())
            || (openaiApiKey != null && !openaiApiKey.isBlank());
    }

    /** Use Gemini if key is set, otherwise OpenAI. */
    private String callAi(String prompt) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return callGemini(prompt);
        }
        if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            return callOpenAI(prompt);
        }
        throw new RuntimeException("No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
    }

    private String callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(Map.of("text", prompt != null ? prompt : "")));
        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(contents));
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 2000);
        body.put("generationConfig", genConfig);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            String friendly = friendlyAiError(response.getStatusCode().value(), response.getBody());
            throw new RuntimeException(friendly != null ? friendly : "Gemini API error: " + response.getStatusCode() + " " + (response.getBody() != null ? response.getBody() : ""));
        }
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            JsonNode candidates = json.get("candidates");
            if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini returned no candidates");
            }
            return candidates.get(0).get("content").get("parts").get(0).get("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    /** Return a short user-facing message for known AI provider errors (429, quota), or null to use default. */
    private static String friendlyAiError(int statusCode, String body) {
        if (statusCode == 429) return "AI rate limit reached. Please wait a minute and try again.";
        String b = body != null ? body : "";
        if (b.contains("quota") || b.contains("RESOURCE_EXHAUSTED") || b.contains("rate limit")) {
            return "AI rate limit reached. Please wait a minute and try again.";
        }
        if (statusCode == 401 || statusCode == 403) return "AI API key invalid or not authorized.";
        return null;
    }

    private String callOpenAI(String prompt) {
        String url = openaiBaseUrl.replaceAll("/$", "") + CHAT_PATH;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", openaiModel);
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", "You are a helpful learning assistant that creates structured educational content."),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2000);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        
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
                JsonNode problem = node.has("problem_text") ? node.get("problem_text") : node.get("problemText");
                if (problem == null || !problem.isTextual()) continue;
                String solution = node.has("solution_text") ? node.get("solution_text").asText() : node.has("solutionText") ? node.get("solutionText").asText() : "";
                int diff = node.has("difficulty") ? node.get("difficulty").asInt() : 2;
                questions.add(new QuestionSuggestion(problem.asText(), solution, diff));
            }
            return questions;
        } catch (Exception e) {
            log.error("Failed to parse question response", e);
            throw new RuntimeException("AI returned questions in an unexpected format. Try again.");
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
