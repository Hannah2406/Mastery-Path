package com.masterypath.api.logs;

import com.masterypath.api.logs.dto.CreateLogRequest;
import com.masterypath.api.logs.dto.LogResponse;
import com.masterypath.domain.model.User;
import com.masterypath.domain.service.AuthService;
import com.masterypath.domain.service.MasteryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/logs")
public class LogController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final MasteryService masteryService;
    private final AuthService authService;

    public LogController(MasteryService masteryService, AuthService authService) {
        this.masteryService = masteryService;
        this.authService = authService;
    }

    @PostMapping public ResponseEntity<?> createLog(@Valid
            @RequestBody CreateLogRequest request,
                                       HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }

        if (!request.getIsSuccess() && request.getErrorCode() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error code is required when not successful"));
        }

        if (request.getIsSuccess() && request.getErrorCode() != null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error code should not be provided when successful"));
        }

        try {
            MasteryService.ProcessLogResult result = masteryService.processLog(
                user,
                request.getNodeId(),
                request.getIsSuccess(),
                request.getErrorCode(),
                request.getDurationMs()
            );

            LogResponse response = new LogResponse(
                result.logId,
                LogResponse.UserSkillDto.from(result.userSkill),
                result.unlockedNodeIds
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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