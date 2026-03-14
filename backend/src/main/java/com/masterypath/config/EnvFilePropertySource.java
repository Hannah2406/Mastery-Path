package com.masterypath.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.Ordered;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads .env from project root or backend directory into the Spring Environment
 * so that GEMINI_API_KEY / OPENAI_API_KEY are available for AI features.
 * Works when started via ./start-all.sh or from the IDE.
 */
public class EnvFilePropertySource implements EnvironmentPostProcessor, Ordered {

    private static final String ENV_SOURCE_NAME = "masterypathEnvFile";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envMap = new LinkedHashMap<>();
        String userDir = System.getProperty("user.dir", "");
        List<Path> toTry = List.of(
            Paths.get(userDir, ".env"),
            Paths.get(userDir, "..", ".env"),
            Paths.get(userDir, "..", "..", ".env")
        );
        for (Path p : toTry) {
            Path normalized = p.normalize().toAbsolutePath();
            if (Files.isRegularFile(normalized)) {
                try {
                    Files.readAllLines(normalized).forEach(line -> {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) return;
                        int eq = line.indexOf('=');
                        if (eq <= 0) return;
                        String key = line.substring(0, eq).trim();
                        String value = line.substring(eq + 1).trim();
                        if (value.startsWith("\"") && value.endsWith("\""))
                            value = value.substring(1, value.length() - 1);
                        else if (value.startsWith("'") && value.endsWith("'"))
                            value = value.substring(1, value.length() - 1);
                        if (!key.isEmpty()) envMap.put(key, value);
                    });
                    environment.getPropertySources().addFirst(new MapPropertySource(ENV_SOURCE_NAME, envMap));
                    boolean hasGemini = envMap.containsKey("GEMINI_API_KEY") && !String.valueOf(envMap.get("GEMINI_API_KEY")).isBlank();
                    boolean hasOpenAI = envMap.containsKey("OPENAI_API_KEY") && !String.valueOf(envMap.get("OPENAI_API_KEY")).isBlank();
                    System.out.println("[MasteryPath] Loaded .env from " + normalized + " (GEMINI_API_KEY=" + hasGemini + ", OPENAI_API_KEY=" + hasOpenAI + ")");
                    return;
                } catch (Exception e) {
                    System.err.println("[MasteryPath] Failed to read .env from " + normalized + ": " + e.getMessage());
                }
            }
        }
        System.out.println("[MasteryPath] No .env found (tried user.dir=" + userDir + "). Set GEMINI_API_KEY or OPENAI_API_KEY in .env at project root and restart.");
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
