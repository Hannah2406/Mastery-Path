package com.masterypath.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    @Autowired
    private DataSource dataSource;

    @GetMapping("/api/v1/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        boolean dbOk = false;
        try (Connection c = dataSource.getConnection()) {
            dbOk = c.isValid(2);
        } catch (Exception ignored) {
        }
        result.put("database", dbOk ? "connected" : "disconnected");
        return result;
    }
}

