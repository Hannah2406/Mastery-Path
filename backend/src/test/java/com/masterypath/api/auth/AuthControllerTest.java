package com.masterypath.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.masterypath.api.auth.dto.LoginRequest;
import com.masterypath.api.auth.dto.RegisterRequest;
import com.masterypath.domain.model.User;
import com.masterypath.domain.service.AuthService;
import com.masterypath.infra.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockBean
    private AuthService authService;

    @Test
    void register_withValidRequest_returnsCreated() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");
        User user = new User("test@example.com", "hashedPassword");
        user.setId(1L);
        when(authService.register("test@example.com", "password123")).thenReturn(user);
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void register_withExistingEmail_returnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("existing@example.com", "password123");
        when(authService.register(anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Email already registered"));
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void register_withInvalidEmail_returnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("invalid-email", "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_withShortPassword_returnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "short");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_withValidCredentials_returnsOk() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        User user = new User("test@example.com", "hashedPassword");
        user.setId(1L);
        when(authService.authenticate("test@example.com", "password123"))
            .thenReturn(Optional.of(user));
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void login_withInvalidCredentials_returnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        when(authService.authenticate(anyString(), anyString()))
            .thenReturn(Optional.empty());
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void logout_returnsNoContent() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isNoContent());
    }

    @Test
    void me_withoutSession_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Not authenticated"));
    }
}
