package com.masterypath.api.paths.dto;

public class PathStatsResponse {
    private int totalNodes;
    private int masteredCount;
    private int reviewDueCount;

    public PathStatsResponse() {}

    public PathStatsResponse(int totalNodes, int masteredCount, int reviewDueCount) {
        this.totalNodes = totalNodes;
        this.masteredCount = masteredCount;
        this.reviewDueCount = reviewDueCount;
    }

    public int getTotalNodes() {
        return totalNodes;
    }

    public void setTotalNodes(int totalNodes) {
        this.totalNodes = totalNodes;
    }

    public int getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(int masteredCount) {
        this.masteredCount = masteredCount;
    }

    public int getReviewDueCount() {
        return reviewDueCount;
    }

    public void setReviewDueCount(int reviewDueCount) {
        this.reviewDueCount = reviewDueCount;
    }
}
