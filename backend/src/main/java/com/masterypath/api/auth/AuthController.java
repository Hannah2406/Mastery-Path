package com.masterypath.api.auth;

import com.masterypath.api.auth.dto.LoginRequest;
import com.masterypath.api.auth.dto.RegisterRequest;
import com.masterypath.api.auth.dto.UserResponse;
import com.masterypath.domain.model.User;
import com.masterypath.domain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            User user = authService.register(request.getEmail(), request.getPassword());
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(USER_ID_SESSION_KEY, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid
            @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return authService.authenticate(request.getEmail(), request.getPassword())
            .<ResponseEntity<?>>map(user -> {
                HttpSession session = httpRequest.getSession(true);
                session.setAttribute(USER_ID_SESSION_KEY, user.getId());
                return ResponseEntity.ok(UserResponse.from(user));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid email or password")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        return authService.findById(userId)
            .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserResponse.from(user)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "User not found")));
    }
}
