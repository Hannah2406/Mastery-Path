package com.masterypath.api.auth.dto;

import com.masterypath.domain.model.User;

public class UserResponse {
    private Long id;
    private String email;

    public UserResponse() {}

    public UserResponse(Long id, String email) {
        this.id = id;
        this.email = email;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
