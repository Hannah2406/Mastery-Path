package com.masterypath.domain.service;

import com.masterypath.domain.model.User;
import com.masterypath.domain.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PathService pathService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, PathService pathService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.pathService = pathService;
    }

    @Transactional public User register(String email, String password) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isEmpty()) throw new IllegalArgumentException("Email is required");
        if (userRepository.existsByEmailIgnoreCase(normalized)) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = new User(normalized, passwordEncoder.encode(password));
        user = userRepository.save(user);
        pathService.createStarterPaths(user);
        return user;
    }

    public Optional<User> authenticate(String email, String password) {
        if (email == null || password == null) return Optional.empty();
        String normalized = email.trim().toLowerCase();
        if (normalized.isEmpty()) return Optional.empty();
        return userRepository.findByEmailIgnoreCase(normalized)
            .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()));
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
