package com.masterypath.api.analytics.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsSummaryResponse {
    private Map<String, Long> mistakeCounts;
    private List<LeakNodeDto> topLeakNodes;
    private int masteredCount;
    private int decayingCount;
    private int availableCount;

    public AnalyticsSummaryResponse() {}

    public AnalyticsSummaryResponse(Map<String, Long> mistakeCounts,
                                   List<LeakNodeDto> topLeakNodes,
                                   int masteredCount, int decayingCount, int availableCount) {
        this.mistakeCounts = mistakeCounts;
        this.topLeakNodes = topLeakNodes;
        this.masteredCount = masteredCount;
        this.decayingCount = decayingCount;
        this.availableCount = availableCount;
    }

    public Map<String, Long> getMistakeCounts() {
        return mistakeCounts;
    }

    public void setMistakeCounts(Map<String, Long> mistakeCounts) {
        this.mistakeCounts = mistakeCounts;
    }

    public List<LeakNodeDto> getTopLeakNodes() {
        return topLeakNodes;
    }

    public void setTopLeakNodes(List<LeakNodeDto> topLeakNodes) {
        this.topLeakNodes = topLeakNodes;
    }

    public int getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(int masteredCount) {
        this.masteredCount = masteredCount;
    }

    public int getDecayingCount() {
        return decayingCount;
    }

    public void setDecayingCount(int decayingCount) {
        this.decayingCount = decayingCount;
    }

    public int getAvailableCount() {
        return availableCount;
    }

    public void setAvailableCount(int availableCount) {
        this.availableCount = availableCount;
    }

    public static class LeakNodeDto {
        private Long nodeId;
        private String nodeName;
        private int failureCount;
        private double masteryScore;

        public LeakNodeDto() {}

        public LeakNodeDto(Long nodeId, String nodeName, int failureCount, double masteryScore) {
            this.nodeId = nodeId;
            this.nodeName = nodeName;
            this.failureCount = failureCount;
            this.masteryScore = masteryScore;
        }

        public Long getNodeId() { return nodeId; }
        public void setNodeId(Long nodeId) { this.nodeId = nodeId; }
        public String getNodeName() { return nodeName; }
        public void setNodeName(String nodeName) { this.nodeName = nodeName; }
        public int getFailureCount() { return failureCount; }
        public void setFailureCount(int failureCount) { this.failureCount = failureCount; }
        public double getMasteryScore() { return masteryScore; }
        public void setMasteryScore(double masteryScore) { this.masteryScore = masteryScore; }
    }
}
