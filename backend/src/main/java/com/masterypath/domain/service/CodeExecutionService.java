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

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.*;

/**
 * Runs user code via Piston public API, with local Java fallback when Piston is unavailable.
 */
@Service
public class CodeExecutionService {
    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);
    private static final String PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";
    private static final int COMPILE_TIMEOUT_SEC = 15;
    private static final int RUN_TIMEOUT_SEC = 10;

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
     * Execute code with the given stdin. Uses Piston API; for Java, falls back to local execution when Piston is unavailable.
     */
    public ExecutionResult execute(String code, String language, String stdin) {
        String pistonLang = toPistonLanguage(language);
        ExecutionResult pistonResult = tryPiston(code, pistonLang, stdin);
        if (pistonResult != null) {
            return pistonResult;
        }
        if ("java".equals(pistonLang)) {
            log.info("Piston failed for Java, trying local execution");
            return runJavaLocally(code, stdin != null ? stdin : "");
        }
        return new ExecutionResult(null, "Code execution service is temporarily unavailable. Run tests locally or try again later.", false);
    }

    private ExecutionResult tryPiston(String code, String language, String stdin) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("language", language);
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
                    return null;
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
            return new ExecutionResult(stdout, stderr.isEmpty() ? null : stderr, exitCode == 0);
        } catch (Exception e) {
            log.warn("Piston execute failed: {}", e.getMessage());
            return null;
        }
    }

    private ExecutionResult runJavaLocally(String code, String stdin) {
        Path dir = null;
        try {
            dir = Files.createTempDirectory("masterypath_java_");
            Path mainJava = dir.resolve("Main.java");
            Files.writeString(mainJava, code, StandardCharsets.UTF_8);

            ProcessBuilder compilePb = new ProcessBuilder("javac", "-encoding", "UTF-8", "Main.java");
            compilePb.directory(dir.toFile());
            compilePb.redirectErrorStream(true);
            Process compileProcess = compilePb.start();
            String compileOut = readFully(compileProcess.getInputStream());
            boolean compiled = compileProcess.waitFor(COMPILE_TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!compiled) {
                compileProcess.destroyForcibly();
                return new ExecutionResult(null, "Compilation timed out.", false);
            }
            if (compileProcess.exitValue() != 0) {
                return new ExecutionResult(null, compileOut.isEmpty() ? "Compilation failed." : compileOut, false);
            }

            ProcessBuilder runPb = new ProcessBuilder("java", "Main");
            runPb.directory(dir.toFile());
            runPb.redirectErrorStream(false);
            Process runProcess = runPb.start();
            if (stdin != null && !stdin.isEmpty()) {
                try (OutputStream os = runProcess.getOutputStream()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                }
            }
            String stdout = readFully(runProcess.getInputStream());
            String stderr = readFully(runProcess.getErrorStream());
            boolean finished = runProcess.waitFor(RUN_TIMEOUT_SEC, TimeUnit.SECONDS);
            if (!finished) {
                runProcess.destroyForcibly();
                return new ExecutionResult(stdout, (stderr.isEmpty() ? "Run timed out (" + RUN_TIMEOUT_SEC + "s)." : stderr + "\nRun timed out."), false);
            }
            int exitCode = runProcess.exitValue();
            return new ExecutionResult(stdout, stderr.isEmpty() ? null : stderr, exitCode == 0);
        } catch (Exception e) {
            log.warn("Local Java execution failed: {}", e.getMessage());
            return new ExecutionResult(null, "Local run failed: " + (e.getMessage() != null ? e.getMessage() : "unknown"), false);
        } finally {
            if (dir != null) {
                try {
                    Files.walk(dir).sorted((a, b) -> -a.compareTo(b)).forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (Exception ignored) { }
                    });
                } catch (Exception ignored) { }
            }
        }
    }

    private static String readFully(java.io.InputStream is) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
        } catch (Exception e) {
            return "";
        }
        return sb.toString();
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
