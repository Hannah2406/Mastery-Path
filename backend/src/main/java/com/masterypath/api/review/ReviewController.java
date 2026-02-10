package com.masterypath.api.review;

import com.masterypath.api.paths.dto.NodeResponse;
import com.masterypath.domain.model.User;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.service.AuthService;
import com.masterypath.domain.service.PathService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/review")
public class ReviewController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final PathService pathService;
    private final AuthService authService;

    public ReviewController(PathService pathService, AuthService authService) {
        this.pathService = pathService;
        this.authService = authService;
    }

    @GetMapping("/queue")
    public ResponseEntity<?> getQueue(
            @RequestParam Long pathId,
            @RequestParam(defaultValue = "20") int limit,
            HttpServletRequest request) {
        User user = getCurrentUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        List<UserSkill> skills = pathService.getReviewQueue(pathId, user.getId(), limit);
        List<NodeResponse> nodes = skills.stream()
            .map(us -> NodeResponse.from(us.getNode(), us))
            .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("nodes", nodes));
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) return null;
        return authService.findById(userId).orElse(null);
    }
}
