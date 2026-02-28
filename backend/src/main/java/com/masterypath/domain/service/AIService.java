package com.masterypath.domain.service;

import com.masterypath.api.ai.dto.TestCaseDTO;
import com.masterypath.api.ai.dto.TestCaseResultDTO;
import com.masterypath.api.ai.dto.CheckCodeResponse;
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

import java.io.ByteArrayOutputStream;
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
    private final CodeExecutionService codeExecutionService;
    private final LeetCodeWrapperService leetCodeWrapperService;

    public AIService(CodeExecutionService codeExecutionService, LeetCodeWrapperService leetCodeWrapperService) {
        this.codeExecutionService = codeExecutionService;
        this.leetCodeWrapperService = leetCodeWrapperService;
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
     * @param pathName optional; if "AMC8" (case-insensitive), uses AMC 8 competition-style, harder prompts.
     */
    public List<QuestionSuggestion> generateQuestions(String topic, String difficulty, int count, String pathName) {
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured. Returning empty list.");
            return List.of();
        }
        boolean amc8Style = pathName != null && pathName.toUpperCase().replace(" ", "").contains("AMC8");
        String prompt = amc8Style
            ? buildAMC8QuestionPrompt(topic, count)
            : buildQuestionGenerationPrompt(topic, difficulty, count);
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
                You are a teacher marking a student's handwritten work. The image may contain:
                - PRINTED/TYPESET text: the problem statement, instructions, or worksheet template (ignore this for evaluation)
                - HANDWRITTEN text: the student's actual answer (this is what you must transcribe and evaluate)
                
                Distinguish clearly: printed text is usually neat, uniform, machine-generated. Handwriting is typically less uniform, may be cursive or print, and is the student's work.
                
                Question or topic: %s
                
                Tasks:
                1. Transcribe ALL handwritten student work accurately (numbers, symbols, equations). Read carefully even if handwriting is messy.
                2. Ignore or do not include the printed problem text in extractedText—only the student's handwritten answer.
                3. Evaluate the handwritten answer for correctness, completeness, and clarity.
                4. Give a score 0-100 and brief constructive feedback.
                
                Return ONLY a valid JSON object (no markdown, no code blocks, no extra text). Escape quotes inside strings. Example:
                {"extractedText": "transcribed student answer here", "score": 85, "feedback": "Brief feedback."}
                """, question != null && !question.isBlank() ? question : "General problem solving");
            
            String response = callAiVision(prompt, base64Image);
            return parseMarkingResponse(response);
        } catch (Exception e) {
            log.error("Failed to mark drawing", e);
            String friendly = friendlyMarkingError(e.getMessage());
            return new MarkingResult(null, friendly != null ? friendly : "Failed to mark your work: " + e.getMessage(), null);
        }
    }

    /** Turn raw AI API errors (429, quota) into a short user-facing message for marking. */
    private static String friendlyMarkingError(String message) {
        if (message == null) return null;
        String m = message.toLowerCase();
        if (m.contains("429") || m.contains("too many requests") || m.contains("resource_exhausted") || m.contains("quota exceeded") || m.contains("rate limit")) {
            return "AI rate limit reached (Gemini free tier is about 20 requests/day). Wait a minute and try again, or try again tomorrow. For more usage, check Google AI Studio billing.";
        }
        if (m.contains("401") || m.contains("unauthorized") || m.contains("not configured")) {
            return "AI is not configured or key is invalid. Add GEMINI_API_KEY or OPENAI_API_KEY to .env and restart the backend.";
        }
        return null;
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
        body.put("generationConfig", Map.of(
            "maxOutputTokens", 4096,
            "responseMimeType", "application/json"
        ));

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
            log.warn("JSON parse failed for marking response, trying fallback extraction", e);
            // Fallback: extract score and feedback with regex when JSON is truncated or malformed
            Integer score = extractFirstInt(response, "\"score\"\\s*:\\s*(\\d+)");
            String feedback = extractFirstMatch(response, "\"feedback\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
            if (feedback == null) feedback = extractFirstMatch(response, "\"feedback\"\\s*:\\s*\"([^\"]{0,800})");
            if (score != null || (feedback != null && !feedback.isBlank())) {
                return new MarkingResult(score, feedback != null && !feedback.isBlank() ? feedback : "Feedback provided but could not be fully parsed.", null);
            }
            return new MarkingResult(null, "AI responded but the format was unclear. Try again or rephrase the question.", null);
        }
    }

    private Integer extractFirstInt(String text, String regex) {
        if (text == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(regex);
        java.util.regex.Matcher m = p.matcher(text);
        return m.find() ? Integer.parseInt(m.group(1)) : null;
    }

    private String extractFirstMatch(String text, String regex) {
        if (text == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(regex);
        java.util.regex.Matcher m = p.matcher(text);
        return m.find() ? m.group(1).replace("\\\"", "\"") : null;
    }
    
    private String extractJsonObject(String response) {
        if (response == null) return "{}";
        String cleaned = response.trim();
        // Strip markdown code blocks (```json ... ``` or ``` ... ```)
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            int endBlock = cleaned.indexOf("```");
            if (endBlock > 0) {
                cleaned = cleaned.substring(0, endBlock);
            } else {
                cleaned = cleaned.replaceFirst("^[\\s\\S]*?```", "");
            }
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end);
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
     * Mark uploaded homework (image or PDF). Image uses vision marking; PDF extracts text then AI evaluates.
     * Supports writing and math. Returns score 0-100 and feedback.
     */
    public MarkingResult markHomework(byte[] fileData, String contentType, String question) {
        if (!aiEnabled || !hasAiKey()) {
            return new MarkingResult(null, "AI is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY for homework marking.", null);
        }
        if (contentType != null && contentType.startsWith("image/")) {
            return markDrawing(fileData, question);
        }
        if (contentType != null && contentType.equals("application/pdf")) {
            try {
                String text = extractTextFromPDF(fileData);
                if (text == null || text.isBlank()) {
                    return new MarkingResult(null, "No text could be extracted from the PDF.", null);
                }
                String prompt = String.format("""
                    You are a teacher. Evaluate this student homework (writing and/or math).
                    %s
                    Student work (extracted text): %s
                    Return ONLY a JSON object with: { "score": 0-100, "feedback": "brief constructive feedback" }
                    """,
                    question != null && !question.isBlank() ? "Question or topic: " + question : "General homework.",
                    text.length() > 8000 ? text.substring(0, 8000) + "..." : text);
                String response = callAi(prompt);
                MarkingResult parsed = parseMarkingResponse(response);
                return new MarkingResult(parsed.getScore(), parsed.getFeedback(), text.length() > 2000 ? text.substring(0, 2000) + "..." : text);
            } catch (Exception e) {
                log.error("Failed to mark PDF homework", e);
                String friendly = friendlyMarkingError(e.getMessage());
                return new MarkingResult(null, friendly != null ? friendly : "Failed to mark homework: " + e.getMessage(), null);
            }
        }
        return new MarkingResult(null, "Unsupported file type. Use PDF or image.", null);
    }

    /**
     * Extract only the problem text from an image, ignoring handwriting.
     * Used for "extract text to PDF" to produce a clean PDF with just the problems.
     */
    public String extractProblemTextOnlyFromImage(byte[] imageData) {
        if (!aiEnabled || !hasAiKey()) {
            log.warn("AI is disabled or API key not configured.");
            throw new RuntimeException("AI is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY for this feature.");
        }
        String base64Image = java.util.Base64.getEncoder().encodeToString(imageData);
        String prompt = """
            This image shows a worksheet, homework, or test with printed problems and possibly handwritten answers.
            Extract ONLY the printed problem text (questions, instructions, problem statements).
            IGNORE all handwriting, student answers, drawings, scribbles, or handwritten content.
            Return only the clean problem text, preserving structure (numbered items, line breaks) as needed.
            Do not include any handwritten content. Output only the problems/questions.
            """;
        return callAiVision(prompt, base64Image);
    }

    /**
     * Create a PDF containing only the given text (no handwriting).
     */
    public byte[] createPdfFromText(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Text cannot be empty");
        }
        try {
            org.apache.pdfbox.pdmodel.PDDocument document = new org.apache.pdfbox.pdmodel.PDDocument();
            org.apache.pdfbox.pdmodel.font.PDType1Font font =
                new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA);
            float fontSize = 12;
            float margin = 50;
            float leading = fontSize * 1.3f;

            java.util.List<String> allLines = new ArrayList<>();
            for (String line : text.split("\n")) {
                if (line != null && !line.isEmpty()) {
                    allLines.add(line.replaceAll("[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f]", " "));
                } else {
                    allLines.add(" ");
                }
            }
            if (allLines.isEmpty()) allLines.add("(No text extracted)");

            int lineIndex = 0;
            while (lineIndex < allLines.size()) {
                org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
                document.addPage(page);
                float pageHeight = page.getMediaBox().getHeight();
                float y = pageHeight - margin;

                try (org.apache.pdfbox.pdmodel.PDPageContentStream cs =
                         new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page)) {
                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.newLineAtOffset(margin, y);
                    while (lineIndex < allLines.size() && y > margin + leading) {
                        String line = allLines.get(lineIndex);
                        try {
                            cs.showText(line);
                        } catch (Exception e) {
                            cs.showText(line.replaceAll("[^\\x20-\\x7e\\u00a0-\\u00ff]", "?"));
                        }
                        cs.newLineAtOffset(0, -leading);
                        y -= leading;
                        lineIndex++;
                    }
                    cs.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to create PDF from text", e);
            throw new RuntimeException("Failed to create PDF: " + e.getMessage());
        }
    }

    /**
     * Generate a homework PDF for a node topic. Creates questions via AI, formats into a student handout
     * (problems with space for answers) plus solution key at the end.
     */
    public byte[] generateHomeworkPdf(String topic, String difficulty, int count, String pathName) {
        List<QuestionSuggestion> questions = generateQuestions(topic, difficulty, count, pathName);
        if (questions == null || questions.isEmpty()) {
            throw new RuntimeException("No questions could be generated. Ensure GEMINI_API_KEY or OPENAI_API_KEY is set.");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Homework: ").append(topic).append("\n\n");
        sb.append("Name: _______________________    Date: _______________\n\n");

        for (int i = 0; i < questions.size(); i++) {
            QuestionSuggestion q = questions.get(i);
            sb.append(i + 1).append(". ").append(q.getProblemText() != null ? q.getProblemText() : "").append("\n\n");
            sb.append("   Answer: _______________________________________________\n\n");
        }
        sb.append("---\n\nSolution key (for teacher)\n\n");
        for (int i = 0; i < questions.size(); i++) {
            QuestionSuggestion q = questions.get(i);
            sb.append(i + 1).append(". ").append(q.getSolutionText() != null ? q.getSolutionText() : "").append("\n\n");
        }
        return createPdfFromText(sb.toString());
    }

    /**
     * Extract text to a clean PDF (problems only, no handwriting).
     * For PDF input: extracts embedded text and creates new PDF.
     * For image input: uses AI to extract only problem text (ignores handwriting), then creates PDF.
     */
    public byte[] extractTextToPdf(byte[] fileData, String contentType) {
        String text;
        if (contentType != null && contentType.equals("application/pdf")) {
            text = extractTextFromPDF(fileData);
        } else if (contentType != null && contentType.startsWith("image/")) {
            text = extractProblemTextOnlyFromImage(fileData);
        } else {
            throw new IllegalArgumentException("Unsupported file type. Use PDF or image.");
        }
        if (text == null || text.isBlank()) {
            throw new RuntimeException("No text could be extracted from the file.");
        }
        return createPdfFromText(text);
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

    /** Public check for controllers to return 503 when AI is not configured. */
    public boolean isAiConfigured() {
        return aiEnabled && hasAiKey();
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
        String diff = difficulty != null ? difficulty.toLowerCase() : "intermediate";
        boolean hard = "hard".equals(diff);
        String levelInstruction = hard
            ? "Make questions genuinely challenging: multi-step, require deep understanding, difficulty 4-5. No trivial one-step problems."
            : "Make questions clear, educational, and appropriate for the difficulty level.";
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
            
            %s
            """, count, topic, difficulty != null ? difficulty : "intermediate", levelInstruction);
    }
    
    /** AMC 8 style: competition math, researched difficulty, authentic problem types. */
    private String buildAMC8QuestionPrompt(String topic, int count) {
        return String.format("""
            You are generating a homework set for the topic "%s". First consider: what specific problem types would be most helpful for a student at AMC 8 competition level for this topic? Then generate exactly %d such questions.
            
            CRITICAL: AMC 8 is a middle-school math competition. Questions must be HARD and require insight.
            NEVER generate trivial arithmetic (e.g. "What is 8+12-6?" or "What is 3*7?" or "Evaluate: 2+3×4"). Every problem must require
            multi-step reasoning, a clever trick, or working backwards.
            
            AUTHENTIC AMC 8 problem types (use these as models):
            - Percent / reverse thinking: "After 20%% discount, price becomes $48. Sales tax 13%% added. Original price?"
            - Number theory (remainders): "Remainder when 3^2026 + 5^2026 is divided by 8?" (use modular arithmetic)
            - Algebra (system disguised): "x+y=7, x²+y²=29. Find xy?" (use (x+y)² - (x²+y²) = 2xy)
            - Geometry (circle + chord): "Circle radius 10, chord length 12. Distance from center to chord?"
            - Counting (casework): "How many integers 1 to 999 have exactly one digit equal to 7?"
            - Probability (conditional): "Fair die rolled twice. Given sum >= 10, prob sum = 10?"
            - Rates / work: "A fills tank in 6h, B in 10h. Both run 2h, then A breaks. How much longer for B?"
            - Combinatorics (restrictions): "Six people at round table. Two refuse to sit next to each other. How many seatings?"
            - Geometry (coordinate): "Points A(0,0), B(6,0), C(0,8). D on BC with BD:DC=1:3. Area of triangle ABD?"
            - Logic / invariants: "Start with 1. Each move: add 5 or multiply by 2. Smallest number > 200 reachable?"
            
            Rules:
            - Answers must be clean (integers or simple fractions) but the path is non-obvious
            - Require 2-5 logical steps; no one-step plug-and-chug
            - Common traps: off-by-one, "at least" vs "exactly", remainder vs quotient
            - Style: concise, competition wording. No extra fluff.
            
            Return a JSON array. Each question must have:
            - problem_text: full problem statement
            - solution_text: complete solution with steps and final numerical answer
            - difficulty: 4 or 5 (all challenging; no easy 1-3 star problems)
            
            Format:
            [
              {"problem_text": "Full problem 1...", "solution_text": "Step 1... Step 2... Answer: ...", "difficulty": 4},
              {"problem_text": "Full problem 2...", "solution_text": "Step 1... Answer: ...", "difficulty": 5}
            ]
            """, topic, count);
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
    
    /**
     * Generate LeetCode-style test cases: function signature + JSON input/output.
     * Returns null if parsing fails; otherwise returns signature and test cases.
     */
    public LeetCodeTestData generateLeetCodeTestCases(String problemStatement) {
        if (!aiEnabled || !hasAiKey()) return null;
        try {
            String prompt = String.format("""
                This is a LeetCode-style coding problem. Extract the function signature and generate 3-5 test cases.
                
                Problem: %s
                
                Return ONLY a JSON object (no markdown):
                {
                  "className": "Solution",
                  "methodName": "twoSum",
                  "paramNames": ["nums", "target"],
                  "testCases": [
                    {"input": "{\\"nums\\":[2,7,11,15],\\"target\\":9}", "expectedOutput": "[0,1]"},
                    {"input": "{\\"nums\\":[3,2,4],\\"target\\":6}", "expectedOutput": "[1,2]"}
                  ]
                }
                
                Rules:
                - className: "Solution" for Java/Python class, null for standalone function
                - methodName: the main function name (e.g. twoSum, lengthOfLongestSubstring)
                - paramNames: parameter names in order
                - input: JSON string (escape quotes). For Java use line-based: "2,7,11,15\\n9" for int[] and int
                - expectedOutput: JSON string of expected return value
                """,
                problemStatement != null ? problemStatement : "Coding problem");
            String response = callAi(prompt);
            String jsonStr = extractJsonObject(response);
            JsonNode root = objectMapper.readTree(jsonStr);
            String className = root.has("className") && !root.get("className").isNull() ? root.get("className").asText() : "Solution";
            String methodName = root.has("methodName") ? root.get("methodName").asText() : "solve";
            List<String> paramNames = new ArrayList<>();
            if (root.has("paramNames") && root.get("paramNames").isArray()) {
                for (JsonNode n : root.get("paramNames")) paramNames.add(n.asText());
            }
            List<TestCaseDTO> cases = new ArrayList<>();
            if (root.has("testCases") && root.get("testCases").isArray()) {
                for (JsonNode tc : root.get("testCases")) {
                    String input = tc.has("input") ? tc.get("input").asText() : "";
                    String expected = tc.has("expectedOutput") ? tc.get("expectedOutput").asText() : "";
                    cases.add(new TestCaseDTO(input, expected));
                }
            }
            if (paramNames.isEmpty()) paramNames = List.of("nums", "target");
            return new LeetCodeTestData(className, methodName, paramNames, cases);
        } catch (Exception e) {
            log.warn("Failed to generate LeetCode test data: {}", e.getMessage());
            return null;
        }
    }

    public static class LeetCodeTestData {
        public final String className;
        public final String methodName;
        public final List<String> paramNames;
        public final List<TestCaseDTO> testCases;
        public LeetCodeTestData(String className, String methodName, List<String> paramNames, List<TestCaseDTO> testCases) {
            this.className = className;
            this.methodName = methodName;
            this.paramNames = paramNames;
            this.testCases = testCases;
        }
    }

    /**
     * Generate test cases (input + expected output) from a coding problem statement using AI.
     */
    public List<TestCaseDTO> generateTestCasesFromProblem(String problemStatement) {
        LeetCodeTestData data = generateLeetCodeTestCases(problemStatement);
        return data != null ? data.testCases : List.of();
    }

    /**
     * Check code against test cases (run via Piston, compare stdout). If testCases is empty, generate with AI.
     * Optionally add AI feedback on the solution.
     */
    public CheckCodeResponse checkCode(String problemStatement, String code, String language,
                                       List<TestCaseDTO> testCases) {
        if (code == null || code.isBlank()) {
            return new CheckCodeResponse(0, 0, 0, List.of(), "Please enter code before running tests.");
        }
        LeetCodeTestData leetCodeData = null;
        List<TestCaseDTO> cases;
        if (testCases != null && !testCases.isEmpty()) {
            cases = testCases;
        } else {
            leetCodeData = generateLeetCodeTestCases(problemStatement);
            cases = leetCodeData != null ? leetCodeData.testCases : List.of();
        }
        if (cases.isEmpty()) {
            return new CheckCodeResponse(0, 0, 0, List.of(),
                "No test cases available. Add test cases or ensure AI is configured to generate them.");
        }

        String codeToRun = code;
        if (leetCodeData == null) {
            leetCodeData = generateLeetCodeTestCases(problemStatement);
        }
        if (leetCodeData != null && !leetCodeData.paramNames.isEmpty()) {
            codeToRun = leetCodeWrapperService.buildWrapper(code, language,
                leetCodeData.className, leetCodeData.methodName, leetCodeData.paramNames);
        }

        List<TestCaseResultDTO> results = new ArrayList<>();
        int passed = 0;
        for (int i = 0; i < cases.size(); i++) {
            TestCaseDTO tc = cases.get(i);
            String stdin = tc.getInput() != null ? tc.getInput() : "";
            if ("java".equalsIgnoreCase(language != null ? language.trim() : "") && stdin.startsWith("{")) {
                stdin = convertJsonInputToLineFormat(stdin, leetCodeData != null ? leetCodeData.paramNames : List.of());
            }
            CodeExecutionService.ExecutionResult run = codeExecutionService.execute(
                codeToRun, language, stdin);
            TestCaseResultDTO res = new TestCaseResultDTO();
            res.setIndex(i + 1);
            res.setInput(tc.getInput());
            res.setExpectedOutput(tc.getExpectedOutput());
            res.setActualOutput(run.getStdout());
            res.setError(run.getStderr());
            boolean ok = run.isSuccess() && normalizeOutput(run.getStdout()).equals(normalizeOutput(tc.getExpectedOutput()));
            res.setPassed(ok);
            if (ok) passed++;
            results.add(res);
        }
        int failed = results.size() - passed;
        String aiFeedback = null;
        if (aiEnabled && hasAiKey()) {
            try {
                String summary = String.format("Passed %d/%d test cases.", passed, results.size());
                boolean executionFailed = passed == 0 && results.stream()
                    .anyMatch(r -> r.getError() != null && (r.getError().contains("401") || r.getError().contains("Unauthorized") || r.getError().contains("execution service") || r.getError().contains("Piston")));
                if (executionFailed) {
                    aiFeedback = getCodeReviewWhenExecutionFails(problemStatement, code, results);
                } else {
                    aiFeedback = getCodeFeedback(problemStatement, code, summary, results);
                }
            } catch (Exception e) {
                log.debug("AI code feedback skipped: {}", e.getMessage());
            }
        }
        return new CheckCodeResponse(passed, failed, results.size(), results, aiFeedback);
    }

    /** When tests could not run (e.g. 401 from Piston), still give code review feedback. */
    private String getCodeReviewWhenExecutionFails(String problem, String code, List<TestCaseResultDTO> results) {
        String err = results.isEmpty() ? "Unknown" : (results.get(0).getError() != null ? results.get(0).getError() : "Execution failed");
        String prompt = String.format("""
            You are a coding tutor. The student submitted this solution for: %s

            We could not run the tests (reason: %s). Review their code anyway.

            Student code:
            %s

            In 3-5 sentences: (1) Say whether the approach looks correct for the problem. (2) If it's Two Sum or similar, confirm they return indices not values. (3) Give one short tip or praise. Do not give the full solution.
            """, problem, err.length() > 200 ? err.substring(0, 200) + "..." : err, code.length() > 2500 ? code.substring(0, 2500) + "..." : code);
        return callAi(prompt);
    }

    private static String normalizeOutput(String s) {
        if (s == null) return "";
        return s.replace("\r\n", "\n").trim();
    }

    private String convertJsonInputToLineFormat(String jsonInput, List<String> paramNames) {
        try {
            JsonNode json = objectMapper.readTree(jsonInput);
            StringBuilder sb = new StringBuilder();
            for (String p : paramNames) {
                if (!json.has(p)) continue;
                JsonNode node = json.get(p);
                if (node.isArray()) {
                    for (int i = 0; i < node.size(); i++) {
                        if (i > 0) sb.append(",");
                        sb.append(node.get(i).asInt());
                    }
                } else if (node.isNumber()) {
                    sb.append(node.asInt());
                } else {
                    sb.append(node.asText());
                }
                sb.append("\n");
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return jsonInput;
        }
    }

    private String getCodeFeedback(String problem, String code, String summary, List<TestCaseResultDTO> results) {
        StringBuilder details = new StringBuilder();
        for (TestCaseResultDTO r : results) {
            details.append("Test ").append(r.getIndex()).append(r.isPassed() ? " passed" : " failed");
            if (!r.isPassed()) {
                details.append(" (expected: ").append(r.getExpectedOutput()).append(", got: ").append(r.getActualOutput()).append(")");
            }
            details.append("; ");
        }
        String prompt = String.format("""
            You are a coding tutor. Problem: %s
            Student code (summary: %s): %s
            Test results: %s
            Give 2-4 short sentences: praise what's correct, and if any tests failed give a hint (not the full fix).
            """, problem, summary, code.length() > 2000 ? code.substring(0, 2000) + "..." : code, details);
        return callAi(prompt);
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
