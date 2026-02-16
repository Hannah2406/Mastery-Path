package com.masterypath.api.paths;

import com.masterypath.api.paths.dto.*;
import com.masterypath.domain.model.Path;
import com.masterypath.domain.model.Node;
import com.masterypath.domain.model.User;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.repo.ProblemRepository;
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
    private final AuthService authService;

    public PathController(PathService pathService, ProblemRepository problemRepository, AuthService authService) {
        this.pathService = pathService;
        this.problemRepository = problemRepository;
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

    @GetMapping("/nodes/{nodeId}/problems")
    public ResponseEntity<?> getProblemsForNode(@PathVariable Long nodeId) {
        List<ProblemResponse> problems = problemRepository.findByNodeIdOrderByDifficultyAsc(nodeId)
            .stream()
            .map(ProblemResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(problems);
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