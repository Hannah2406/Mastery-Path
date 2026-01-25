package com.masterypath.api.history;

import com.masterypath.api.history.dto.HeatmapResponse;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
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

    @GetMapping("/heatmap")
    public ResponseEntity<?> getHeatmap(HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }

        // Get data for the last year
        LocalDate oneYearAgo = LocalDate.now().minusYears(1);
        List<PerformanceLog> allLogs = performanceLogRepository.findByUserIdOrderByOccurredAtDesc(user.getId());
        
        // Filter logs from last year and group by date
        Map<String, Integer> contributions = new HashMap<>();
        for (PerformanceLog log : allLogs) {
            LocalDate logDate = log.getOccurredAt().toLocalDate();
            if (logDate.isAfter(oneYearAgo) || logDate.isEqual(oneYearAgo)) {
                String dateStr = logDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
                contributions.put(dateStr, contributions.getOrDefault(dateStr, 0) + 1);
            }
        }

        // Calculate streaks
        int currentStreak = calculateCurrentStreak(allLogs);
        int longestStreak = calculateLongestStreak(allLogs);

        HeatmapResponse response = new HeatmapResponse(
            contributions,
            allLogs.size(),
            currentStreak,
            longestStreak
        );

        return ResponseEntity.ok(response);
    }

    private int calculateCurrentStreak(List<PerformanceLog> logs) {
        if (logs.isEmpty()) return 0;
        
        // Get unique practice dates
        Map<LocalDate, Boolean> practiceDays = new HashMap<>();
        for (PerformanceLog log : logs) {
            practiceDays.put(log.getOccurredAt().toLocalDate(), true);
        }
        
        LocalDate today = LocalDate.now();
        int streak = 0;
        LocalDate current = today;
        
        // Check if today has practice, if not start from yesterday
        if (!practiceDays.containsKey(today)) {
            current = today.minusDays(1);
        }
        
        // Count consecutive days backwards
        while (practiceDays.containsKey(current)) {
            streak++;
            current = current.minusDays(1);
        }
        
        return streak;
    }

    private int calculateLongestStreak(List<PerformanceLog> logs) {
        if (logs.isEmpty()) return 0;
        
        // Get unique practice dates and sort them
        List<LocalDate> practiceDates = logs.stream()
            .map(log -> log.getOccurredAt().toLocalDate())
            .distinct()
            .sorted()
            .toList();
        
        if (practiceDates.isEmpty()) return 0;
        
        int longestStreak = 1;
        int currentStreak = 1;
        
        for (int i = 1; i < practiceDates.size(); i++) {
            LocalDate prev = practiceDates.get(i - 1);
            LocalDate curr = practiceDates.get(i);
            
            if (curr.equals(prev.plusDays(1))) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        
        return longestStreak;
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
