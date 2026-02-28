package com.masterypath.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Runs user code via Piston public API (https://emkc.org/api/v2/piston).
 */
@Service
public class CodeExecutionService {
    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);
    private static final String PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Map frontend language id to Piston runtime name.
     */
    public String toPistonLanguage(String language) {
        if (language == null || language.isBlank()) return "python";
        String lower = language.trim().toLowerCase();
        if (lower.startsWith("py")) return "python";
        if (lower.startsWith("js") || lower.equals("javascript")) return "javascript";
        if (lower.equals("java")) return "java";
        if (lower.startsWith("cpp") || lower.equals("c++")) return "cpp";
        if (lower.startsWith("c ") || lower.equals("c")) return "c";
        return "python";
    }

    /**
     * Execute code with the given stdin. Returns stdout on success; throws or returns stderr info on failure.
     */
    public ExecutionResult execute(String code, String language, String stdin) {
        String pistonLang = toPistonLanguage(language);
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("language", pistonLang);
            root.put("version", "*");
            ArrayNode files = objectMapper.createArrayNode();
            ObjectNode file = objectMapper.createObjectNode();
            file.put("content", code != null ? code : "");
            files.add(file);
            root.set("files", files);
            root.put("stdin", stdin != null ? stdin : "");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "MasteryPath/1.0");
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(PISTON_EXECUTE_URL, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                int statusCode = response.getStatusCode().value();
                if (statusCode == 401 || statusCode == 403) {
                    return new ExecutionResult(null, "Code execution service (Piston) returned auth error. Tests cannot run; try again later or run your code locally.", false);
                }
                return new ExecutionResult(null, "Execution service returned " + statusCode + ". Try again later.", false);
            }

            JsonNode body = objectMapper.readTree(response.getBody());
            JsonNode run = body.get("run");
            if (run == null) {
                JsonNode compile = body.get("compile");
                if (compile != null && compile.has("stderr") && !compile.get("stderr").asText().isBlank()) {
                    return new ExecutionResult(null, compile.get("stderr").asText(), false);
                }
                return new ExecutionResult(null, "No run output in response.", false);
            }
            String stderr = run.has("stderr") ? run.get("stderr").asText() : "";
            String stdout = run.has("stdout") ? run.get("stdout").asText() : "";
            int exitCode = run.has("code") ? run.get("code").asInt() : -1;
            if (exitCode != 0 && stderr.isBlank()) stderr = "Process exited with code " + exitCode;
            boolean success = exitCode == 0;
            return new ExecutionResult(stdout, stderr.isEmpty() ? null : stderr, success);
        } catch (Exception e) {
            log.warn("Piston execute failed: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("401") || msg.contains("Unauthorized")) {
                return new ExecutionResult(null, "Code execution service is temporarily unavailable. Run tests locally or try again later.", false);
            }
            return new ExecutionResult(null, "Execution failed: " + msg, false);
        }
    }

    public static class ExecutionResult {
        private final String stdout;
        private final String stderr;
        private final boolean success;

        public ExecutionResult(String stdout, String stderr, boolean success) {
            this.stdout = stdout;
            this.stderr = stderr;
            this.success = success;
        }
        public String getStdout() { return stdout; }
        public String getStderr() { return stderr; }
        public boolean isSuccess() { return success; }
    }
}
