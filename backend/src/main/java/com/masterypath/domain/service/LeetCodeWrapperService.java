package com.masterypath.domain.service;

import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds LeetCode-style wrappers: user writes a class/function with parameters,
 * we wrap it to read JSON input, call the function, and print the result.
 */
@Service
public class LeetCodeWrapperService {
    /**
     * Build runnable code that wraps the user's LeetCode-style solution.
     * @param userCode The user's class/function code
     * @param language python, java, or javascript
     * @param className e.g. "Solution" or null for standalone function
     * @param methodName e.g. "twoSum"
     * @param paramNames e.g. ["nums", "target"]
     */
    public String buildWrapper(String userCode, String language, String className, String methodName, List<String> paramNames) {
        if (userCode == null || userCode.isBlank()) return "";
        String lang = language != null ? language.trim().toLowerCase() : "python";
        if (lang.startsWith("py")) {
            return buildPythonWrapper(userCode, className, methodName, paramNames);
        }
        if (lang.equals("java")) {
            return buildJavaWrapper(userCode, className, methodName, paramNames);
        }
        if (lang.startsWith("js") || lang.equals("javascript")) {
            return buildJavaScriptWrapper(userCode, className, methodName, paramNames);
        }
        return buildPythonWrapper(userCode, className, methodName, paramNames);
    }

    private String buildPythonWrapper(String userCode, String className, String methodName, List<String> paramNames) {
        StringBuilder sb = new StringBuilder();
        if (!userCode.contains("import json") && !userCode.contains("import sys")) {
            sb.append("import json\nimport sys\n\n");
        }
        sb.append(userCode).append("\n\n");
        sb.append("data = json.loads(sys.stdin.read())\n");
        if (className != null && !className.isBlank()) {
            sb.append("result = ").append(className).append("().").append(methodName).append("(");
        } else {
            sb.append("result = ").append(methodName).append("(");
        }
        for (int i = 0; i < paramNames.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("data['").append(paramNames.get(i)).append("']");
        }
        sb.append(")\n");
        sb.append("print(json.dumps(result))\n");
        return sb.toString();
    }

    private String buildJavaWrapper(String userCode, String className, String methodName, List<String> paramNames) {
        // Input format: one line per param. Line 1 = first param (e.g. "2,7,11,15" for int[]), line 2 = second (e.g. "9" for int)
        // We use reflection to call the method generically.
        // Java allows only one public class per file, so we put imports first and make the solution class package-private.
        StringBuilder sb = new StringBuilder();
        sb.append("import java.util.*;\n\n");
        // Make user's class package-private so we can have both Solution and public Main in one file
        String code = userCode.trim();
        if (className != null && !className.isEmpty()) {
            code = code.replaceFirst("public\\s+class\\s+" + className + "\\b", "class " + className);
        }
        sb.append(code);
        if (!code.endsWith("}")) sb.append("\n");
        sb.append("\n\npublic class Main {\n");
        sb.append("    public static void main(String[] args) throws Exception {\n");
        sb.append("        Scanner sc = new Scanner(System.in);\n");
        sb.append("        java.util.List<String> lines = new java.util.ArrayList<>();\n");
        sb.append("        while (sc.hasNextLine()) lines.add(sc.nextLine());\n");
        String clsName = className != null && !className.isBlank() ? className : "Solution";
        sb.append("        ").append(clsName).append(" sol = new ").append(clsName).append("();\n");
        sb.append("        java.lang.reflect.Method m = ").append(clsName).append(".class.getMethod(\"").append(methodName).append("\", ");
        sb.append(buildJavaParamTypes(paramNames));
        sb.append(");\n");
        sb.append("        Object result = m.invoke(sol, ");
        sb.append(buildJavaParseArgs(paramNames));
        sb.append(");\n");
        sb.append("        System.out.println(toJson(result));\n");
        sb.append("    }\n");
        sb.append("    static int[] parseIntArray(String s) {\n");
        sb.append("        if (s == null || s.trim().isEmpty()) return new int[0];\n");
        sb.append("        String[] p = s.split(\",\");\n");
        sb.append("        int[] a = new int[p.length];\n");
        sb.append("        for (int i = 0; i < p.length; i++) a[i] = Integer.parseInt(p[i].trim());\n");
        sb.append("        return a;\n");
        sb.append("    }\n");
        sb.append("    static String toJson(Object o) {\n");
        sb.append("        if (o == null) return \"null\";\n");
        sb.append("        if (o instanceof int[]) return java.util.Arrays.toString((int[])o).replace(\" \", \"\");\n");
        sb.append("        if (o instanceof Integer) return o.toString();\n");
        sb.append("        return String.valueOf(o);\n");
        sb.append("    }\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String buildJavaParamTypes(List<String> paramNames) {
        // Assume common LeetCode types: first param often int[], second int. Vary by problem.
        if (paramNames.size() >= 2 && paramNames.get(0).toLowerCase().contains("num") && paramNames.get(1).toLowerCase().contains("target")) {
            return "int[].class, int.class";
        }
        if (paramNames.size() == 1 && paramNames.get(0).toLowerCase().contains("s")) {
            return "String.class";
        }
        return "int[].class, int.class";
    }

    private String buildJavaParseArgs(List<String> paramNames) {
        if (paramNames.size() >= 2 && paramNames.get(0).toLowerCase().contains("num") && paramNames.get(1).toLowerCase().contains("target")) {
            return "parseIntArray(lines.get(0)), Integer.parseInt(lines.get(1).trim())";
        }
        if (paramNames.size() == 1 && paramNames.get(0).toLowerCase().contains("s")) {
            return "lines.get(0)";
        }
        return "parseIntArray(lines.get(0)), Integer.parseInt(lines.get(1).trim())";
    }

    private String buildJavaScriptWrapper(String userCode, String className, String methodName, List<String> paramNames) {
        StringBuilder sb = new StringBuilder();
        sb.append(userCode).append("\n\n");
        sb.append("const readline = require('readline');\n");
        sb.append("const rl = readline.createInterface({ input: process.stdin });\n");
        sb.append("let input = '';\n");
        sb.append("rl.on('line', line => input += line);\n");
        sb.append("rl.on('close', () => {\n");
        sb.append("  const data = JSON.parse(input);\n");
        sb.append("  ");
        if (className != null && !className.isBlank()) {
            sb.append("const sol = new ").append(className).append("();\n  ");
            sb.append("const result = sol.").append(methodName).append("(");
        } else {
            sb.append("const result = ").append(methodName).append("(");
        }
        for (int i = 0; i < paramNames.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("data.").append(paramNames.get(i));
        }
        sb.append(");\n");
        sb.append("  console.log(JSON.stringify(result));\n");
        sb.append("});\n");
        return sb.toString();
    }
}
