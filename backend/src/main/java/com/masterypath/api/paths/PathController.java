package com.masterypath.api.paths;

import com.masterypath.api.paths.dto.*;
import com.masterypath.domain.model.Path;
import com.masterypath.domain.model.Node;
import com.masterypath.domain.model.Problem;
import com.masterypath.domain.model.User;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.repo.NodeRepository;
import com.masterypath.domain.repo.ProblemRepository;
import com.masterypath.domain.service.AIService;
import com.masterypath.domain.service.AuthService;
import com.masterypath.domain.service.PathService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/paths")
public class PathController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final PathService pathService;
    private final ProblemRepository problemRepository;
    private final NodeRepository nodeRepository;
    private final AIService aiService;
    private final AuthService authService;

    public PathController(PathService pathService, ProblemRepository problemRepository,
                          NodeRepository nodeRepository, AIService aiService, AuthService authService) {
        this.pathService = pathService;
        this.problemRepository = problemRepository;
        this.nodeRepository = nodeRepository;
        this.aiService = aiService;
        this.authService = authService;
    }

    @GetMapping public ResponseEntity<?> getAllPaths(HttpServletRequest request) {
        Long userId = getUserIdFromSession(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        List<PathResponse> paths = pathService.getAllPaths(userId).stream()
            .map(PathResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(paths);
    }

    @PostMapping
    public ResponseEntity<?> createPath(@Valid @RequestBody CreatePathRequest request, HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        Path path = pathService.createPath(user, request.getName(), request.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(PathResponse.from(path));
    }

    /** Create a path from AI-generated suggestions (name, description, list of nodes). Path will contain real nodes in order. */
    @PostMapping("/from-ai")
    public ResponseEntity<?> createPathFromAI(@Valid @RequestBody CreatePathFromAIRequest request, HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            Path path = pathService.createPathFromAISuggestions(
                user, request.getName(), request.getDescription(), request.getSuggestions());
            return ResponseEntity.status(HttpStatus.CREATED).body(PathResponse.from(path));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/nodes/{nodeId}/problems")
    public ResponseEntity<?> getProblemsForNode(@PathVariable Long nodeId) {
        List<ProblemResponse> problems = problemRepository.findByNodeIdOrderByDifficultyAsc(nodeId)
            .stream()
            .map(ProblemResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(problems);
    }

    /**
     * Generate practice questions for this node via AI (AMC 8 / Blind 75 style based on path name) and save them.
     * Use when a node has no problems so each node gets questions like Blind 75 or AMC 8.
     */
    @PostMapping("/nodes/{nodeId}/generate-questions")
    public ResponseEntity<?> generateAndSaveQuestionsForNode(
            @PathVariable Long nodeId,
            @RequestBody(required = false) GenerateNodeQuestionsRequest body,
            HttpServletRequest request) {
        User user = getCurrentUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        if (!aiService.isAiConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "AI is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env and restart the backend."));
        }
        Node node = nodeRepository.findById(nodeId).orElse(null);
        if (node == null) {
            return ResponseEntity.notFound().build();
        }
        String pathName = body != null && body.getPathName() != null ? body.getPathName() : null;
        int count = body != null && body.getCount() != null && body.getCount() > 0 ? body.getCount() : 5;
        String difficulty = body != null && body.getDifficulty() != null && !body.getDifficulty().isBlank()
            ? body.getDifficulty() : "intermediate";
        String topic = node.getName() + (node.getDescription() != null && !node.getDescription().isBlank()
            ? " " + node.getDescription() : "");
        try {
            List<AIService.QuestionSuggestion> suggestions = aiService.generateQuestions(topic, difficulty, count, pathName);
            List<Problem> saved = new java.util.ArrayList<>();
            for (AIService.QuestionSuggestion q : suggestions) {
                Problem p = new Problem(node, q.getProblemText(), q.getSolutionText(), q.getDifficulty());
                saved.add(problemRepository.save(p));
            }
            List<ProblemResponse> response = saved.stream().map(ProblemResponse::from).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to generate questions: " + e.getMessage()));
        }
    }

    @GetMapping("/{pathId}")
    public ResponseEntity<?> getPath(@PathVariable Long pathId, HttpServletRequest request) {
        Long userId = getUserIdFromSession(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        return pathService.getPathById(pathId, userId)
            .<ResponseEntity<?>>map(path -> ResponseEntity.ok(PathResponse.from(path)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{pathId}/tree")
    public ResponseEntity<?> getTree(@PathVariable Long pathId, HttpServletRequest request) {
        Long userId = getUserIdFromSession(request);
        try {
            PathService.TreeData treeData = pathService.getTreeForPath(pathId, userId);
            List<NodeResponse> nodeResponses = treeData.nodes.stream()
                .map(node -> NodeResponse.from(node, treeData.userSkillMap.get(node.getId())))
                .collect(Collectors.toList());
            List<EdgeResponse> edgeResponses = treeData.edges.stream()
                .map(edge -> new EdgeResponse(edge.source, edge.target))
                .collect(Collectors.toList());
            TreeResponse response = new TreeResponse(
                treeData.path.getId(),
                treeData.path.getName(),
                nodeResponses,
                edgeResponses
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{pathId}/stats")
    public ResponseEntity<?> getPathStats(@PathVariable Long pathId, HttpServletRequest request) {
        Long userId = getUserIdFromSession(request);
        return pathService.getPathStats(pathId, userId)
            .map(stats -> ResponseEntity.ok(new PathStatsResponse(
                stats.totalNodes,
                stats.masteredCount,
                stats.reviewDueCount
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    private Long getUserIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (Long) session.getAttribute(USER_ID_SESSION_KEY);
    }

    private User getCurrentUser(HttpServletRequest request) {
        Long userId = getUserIdFromSession(request);
        if (userId == null) return null;
        return authService.findById(userId).orElse(null);
    }
}