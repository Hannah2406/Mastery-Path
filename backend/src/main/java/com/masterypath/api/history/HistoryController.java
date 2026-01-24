package com.masterypath.api.history;

import com.masterypath.api.history.dto.PracticeLogResponse;
import com.masterypath.api.history.dto.StatsResponse;
import com.masterypath.domain.model.PerformanceLog;
import com.masterypath.domain.model.User;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.PerformanceLogRepository;
import com.masterypath.domain.repo.UserSkillRepository;
import com.masterypath.domain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/history")
public class HistoryController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final PerformanceLogRepository performanceLogRepository;
    private final UserSkillRepository userSkillRepository;
    private final AuthService authService;

    public HistoryController(PerformanceLogRepository performanceLogRepository,
                             UserSkillRepository userSkillRepository,
                             AuthService authService) {
        this.performanceLogRepository = performanceLogRepository;
        this.userSkillRepository = userSkillRepository;
        this.authService = authService;
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs(
            @RequestParam(defaultValue = "50") int limit,
            HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        List<PerformanceLog> logs = performanceLogRepository.findRecentByUserId(user.getId(), limit);
        List<PracticeLogResponse> response = logs.stream()
            .map(PracticeLogResponse::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/node/{nodeId}")
    public ResponseEntity<?> getNodeLogs(
            @PathVariable Long nodeId,
            HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        List<PerformanceLog> logs = performanceLogRepository.findByUserIdAndNodeIdOrderByOccurredAtDesc(
            user.getId(), nodeId
        );
        List<PracticeLogResponse> response = logs.stream()
            .map(PracticeLogResponse::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        List<PerformanceLog> allLogs = performanceLogRepository.findByUserIdOrderByOccurredAtDesc(user.getId());
        List<UserSkill> skills = userSkillRepository.findByUserId(user.getId());

        StatsResponse stats = new StatsResponse();

        // Practice stats
        stats.setTotalPractices(allLogs.size());
        int successCount = (int) allLogs.stream().filter(PerformanceLog::isSuccess).count();
        stats.setSuccessCount(successCount);
        stats.setFailureCount(allLogs.size() - successCount);
        stats.setSuccessRate(allLogs.isEmpty() ? 0 : (double) successCount / allLogs.size());
        stats.setTotalTimeMs(allLogs.stream()
            .mapToInt(log -> log.getDurationMs() != null ? log.getDurationMs() : 0)
            .sum());

        // Skill stats
        stats.setMasteredCount((int) skills.stream()
            .filter(s -> s.getNodeStatus() == NodeStatus.MASTERED)
            .count());
        stats.setAvailableCount((int) skills.stream()
            .filter(s -> s.getNodeStatus() == NodeStatus.AVAILABLE || s.getNodeStatus() == NodeStatus.DECAYING)
            .count());

        return ResponseEntity.ok(stats);
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) {
            return null;
        }
        return authService.findById(userId).orElse(null);
    }
}
