package com.masterypath.domain.service;

import com.masterypath.domain.model.User;
import com.masterypath.domain.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void register_withNewEmail_createsUser() {
        String email = "test@example.com";
        String password = "password123";
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        User result = authService.register(email, password);
        assertNotNull(result);
        assertEquals(email, result.getEmail());
        assertNotNull(result.getPasswordHash());
        assertNotEquals(password, result.getPasswordHash());
        assertTrue(passwordEncoder.matches(password, result.getPasswordHash()));
        verify(userRepository).existsByEmail(email);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_withExistingEmail_throwsException() {
        String email = "existing@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(true);
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.register(email, "password123")
        );
        assertEquals("Email already registered", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void authenticate_withValidCredentials_returnsUser() {
        String email = "test@example.com";
        String password = "password123";
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(email, hashedPassword);
        user.setId(1L);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        Optional<User> result = authService.authenticate(email, password);
        assertTrue(result.isPresent());
        assertEquals(email, result.get().getEmail());
    }

    @Test
    void authenticate_withInvalidPassword_returnsEmpty() {
        String email = "test@example.com";
        String correctPassword = "password123";
        String wrongPassword = "wrongpassword";
        String hashedPassword = passwordEncoder.encode(correctPassword);
        User user = new User(email, hashedPassword);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        Optional<User> result = authService.authenticate(email, wrongPassword);
        assertTrue(result.isEmpty());
    }

    @Test
    void authenticate_withNonExistentEmail_returnsEmpty() {
        String email = "nonexistent@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        Optional<User> result = authService.authenticate(email, "password123");
        assertTrue(result.isEmpty());
    }

    @Test
    void findById_withExistingId_returnsUser() {
        Long userId = 1L;
        User user = new User("test@example.com", "hashedPassword");
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        Optional<User> result = authService.findById(userId);
        assertTrue(result.isPresent());
        assertEquals(userId, result.get().getId());
    }

    @Test
    void findById_withNonExistentId_returnsEmpty() {
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        Optional<User> result = authService.findById(userId);
        assertTrue(result.isEmpty());
    }
}
