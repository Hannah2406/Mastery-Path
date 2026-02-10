package com.masterypath.api.analytics;

import com.masterypath.api.analytics.dto.AnalyticsSummaryResponse;
import com.masterypath.domain.model.PerformanceLog;
import com.masterypath.domain.model.User;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.ErrorCode;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.PerformanceLogRepository;
import com.masterypath.domain.repo.UserSkillRepository;
import com.masterypath.domain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final PerformanceLogRepository performanceLogRepository;
    private final UserSkillRepository userSkillRepository;
    private final AuthService authService;

    public AnalyticsController(PerformanceLogRepository performanceLogRepository,
                              UserSkillRepository userSkillRepository,
                              AuthService authService) {
        this.performanceLogRepository = performanceLogRepository;
        this.userSkillRepository = userSkillRepository;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestParam(defaultValue = "30") int range,
            HttpServletRequest request) {
        User user = getCurrentUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        LocalDateTime since = LocalDateTime.now().minusDays(Math.min(Math.max(range, 1), 365));
        List<PerformanceLog> logs = performanceLogRepository.findByUserIdSince(user.getId(), since);

        Map<String, Long> mistakeCounts = new HashMap<>();
        for (ErrorCode code : ErrorCode.values()) {
            mistakeCounts.put(code.name(), 0L);
        }
        Map<Long, Integer> failureCountByNode = new HashMap<>();
        for (PerformanceLog log : logs) {
            if (!log.isSuccess() && log.getErrorCode() != null) {
                mistakeCounts.merge(log.getErrorCode().name(), 1L, Long::sum);
                failureCountByNode.merge(log.getNode().getId(), 1, Integer::sum);
            }
        }

        List<AnalyticsSummaryResponse.LeakNodeDto> topLeaks = failureCountByNode.entrySet().stream()
            .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
            .limit(10)
            .map(e -> {
                Long nodeId = e.getKey();
                int failures = e.getValue();
                UserSkill us = userSkillRepository.findByUserIdAndNodeId(user.getId(), nodeId).orElse(null);
                String name = us != null ? us.getNode().getName() : "Node " + nodeId;
                double score = us != null ? us.getMasteryScore() : 0.0;
                return new AnalyticsSummaryResponse.LeakNodeDto(nodeId, name, failures, score);
            })
            .toList();

        List<UserSkill> skills = userSkillRepository.findByUserId(user.getId());
        int mastered = (int) skills.stream().filter(s -> s.getNodeStatus() == NodeStatus.MASTERED).count();
        int decaying = (int) skills.stream().filter(s -> s.getNodeStatus() == NodeStatus.DECAYING).count();
        int available = (int) skills.stream()
            .filter(s -> s.getNodeStatus() == NodeStatus.AVAILABLE).count();

        AnalyticsSummaryResponse response = new AnalyticsSummaryResponse(
            mistakeCounts,
            topLeaks,
            mastered,
            decaying,
            available
        );
        return ResponseEntity.ok(response);
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) return null;
        return authService.findById(userId).orElse(null);
    }
}
