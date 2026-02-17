package com.masterypath.api.ai;

import com.masterypath.api.ai.dto.CheckAnswerRequest;
import com.masterypath.api.ai.dto.*;
import com.masterypath.domain.model.User;
import com.masterypath.domain.service.AIService;
import com.masterypath.domain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AIController {
    private static final String USER_ID_SESSION_KEY = "userId";
    
    private final AIService aiService;
    private final AuthService authService;
    
    public AIController(AIService aiService, AuthService authService) {
        this.aiService = aiService;
        this.authService = authService;
    }
    
    @PostMapping("/generate-path")
    public ResponseEntity<?> generatePath(@Valid @RequestBody GeneratePathRequest request,
                                         HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        
        try {
            List<AIService.PathNodeSuggestion> suggestions = aiService.generatePath(
                request.getDescription(),
                request.getDifficulty(),
                request.getEstimatedTimeMinutes()
            );
            
            GeneratePathResponse response = new GeneratePathResponse();
            response.setSuggestions(suggestions.stream()
                .map(s -> {
                    GeneratePathResponse.NodeSuggestionDTO dto = new GeneratePathResponse.NodeSuggestionDTO(s.getName(), s.getDescription(), s.getCategory());
                    return dto;
                })
                .toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to generate path: " + e.getMessage()));
        }
    }
    
    @PostMapping("/generate-questions")
    public ResponseEntity<?> generateQuestions(@Valid @RequestBody GenerateQuestionsRequest request,
                                               HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        
        try {
            List<AIService.QuestionSuggestion> questions = aiService.generateQuestions(
                request.getTopic(),
                request.getDifficulty(),
                request.getCount() != null ? request.getCount() : 5
            );
            
            GenerateQuestionsResponse response = new GenerateQuestionsResponse();
            response.setQuestions(questions.stream()
                .map(q -> {
                    GenerateQuestionsResponse.QuestionDTO dto = new GenerateQuestionsResponse.QuestionDTO(q.getProblemText(), q.getSolutionText(), q.getDifficulty());
                    return dto;
                })
                .toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to generate questions: " + e.getMessage()));
        }
    }
    
    @PostMapping("/generate-similar-questions")
    public ResponseEntity<?> generateSimilarQuestions(@Valid @RequestBody GenerateSimilarQuestionsRequest request,
                                                     HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        
        try {
            List<AIService.QuestionSuggestion> questions = aiService.generateSimilarQuestions(
                request.getOriginalQuestion(),
                request.getTopic(),
                request.getErrorType()
            );
            
            GenerateQuestionsResponse response = new GenerateQuestionsResponse();
            response.setQuestions(questions.stream()
                .map(q -> {
                    GenerateQuestionsResponse.QuestionDTO dto = new GenerateQuestionsResponse.QuestionDTO(q.getProblemText(), q.getSolutionText(), q.getDifficulty());
                    return dto;
                })
                .toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to generate similar questions: " + e.getMessage()));
        }
    }
    
    @PostMapping(value = "/extract-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> extractText(@RequestParam("file") MultipartFile file,
                                        HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "File is empty"));
        }
        
        try {
            String extractedText;
            String contentType = file.getContentType();
            
            if (contentType != null && contentType.equals("application/pdf")) {
                extractedText = aiService.extractTextFromPDF(file.getBytes());
            } else if (contentType != null && contentType.startsWith("image/")) {
                extractedText = aiService.extractTextFromImage(file.getBytes());
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unsupported file type. Please upload PDF or image."));
            }
            
            return ResponseEntity.ok(Map.of("extractedText", extractedText));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to extract text: " + e.getMessage()));
        }
    }
    
    @PostMapping(value = "/mark-drawing", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> markDrawing(@RequestParam("image") MultipartFile image,
                                        @RequestParam(value = "question", required = false) String question,
                                        HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        
        if (image.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Image is empty"));
        }
        
        try {
            AIService.MarkingResult result = aiService.markDrawing(image.getBytes(), question);
            Map<String, Object> response = new HashMap<>();
            response.put("score", result.getScore());
            response.put("feedback", result.getFeedback());
            response.put("extractedText", result.getExtractedText());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to mark drawing: " + e.getMessage()));
        }
    }
    
    @PostMapping("/check-answer")
    public ResponseEntity<?> checkAnswer(@RequestBody CheckAnswerRequest request,
                                        HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        try {
            AIService.CheckAnswerResult result = aiService.checkAnswer(
                request.getQuestion(), request.getAnswer());
            Map<String, Object> response = new HashMap<>();
            response.put("correct", result.isCorrect());
            response.put("score", result.getScore());
            response.put("feedback", result.getFeedback());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to check answer: " + e.getMessage()));
        }
    }
    
    @PostMapping("/live-feedback")
    public ResponseEntity<?> liveFeedback(@RequestBody CheckAnswerRequest request,
                                         HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        try {
            String feedback = aiService.getLiveFeedback(request.getQuestion(), request.getAnswer());
            return ResponseEntity.ok(Map.of("feedback", feedback));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get feedback: " + e.getMessage()));
        }
    }
    
    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) return null;
        return authService.findById(userId).orElse(null);
    }
}
