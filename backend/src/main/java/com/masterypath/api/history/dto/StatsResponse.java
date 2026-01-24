package com.masterypath.api.history.dto;

public class StatsResponse {
    private int totalPractices;
    private int successCount;
    private int failureCount;
    private double successRate;
    private int totalTimeMs;
    private int masteredCount;
    private int availableCount;
    private int lockedCount;

    public StatsResponse() {}

    public int getTotalPractices() {
        return totalPractices;
    }

    public void setTotalPractices(int totalPractices) {
        this.totalPractices = totalPractices;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }

    public int getTotalTimeMs() {
        return totalTimeMs;
    }

    public void setTotalTimeMs(int totalTimeMs) {
        this.totalTimeMs = totalTimeMs;
    }

    public int getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(int masteredCount) {
        this.masteredCount = masteredCount;
    }

    public int getAvailableCount() {
        return availableCount;
    }

    public void setAvailableCount(int availableCount) {
        this.availableCount = availableCount;
    }

    public int getLockedCount() {
        return lockedCount;
    }

    public void setLockedCount(int lockedCount) {
        this.lockedCount = lockedCount;
    }
}