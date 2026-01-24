package com.masterypath.api.history.dto;

import com.masterypath.domain.model.PerformanceLog;
import com.masterypath.domain.model.enums.ErrorCode;

import java.time.LocalDateTime;

public class PracticeLogResponse {
    private Long id;
    private Long nodeId;
    private String nodeName;
    private String categoryName;
    private boolean isSuccess;
    private ErrorCode errorCode;
    private Integer durationMs;
    private Integer attemptNumber;
    private LocalDateTime occurredAt;

    public PracticeLogResponse() {}

    public static PracticeLogResponse from(PerformanceLog log) {
        PracticeLogResponse response = new PracticeLogResponse();
        response.setId(log.getId());
        response.setNodeId(log.getNode().getId());
        response.setNodeName(log.getNode().getName());
        response.setCategoryName(log.getNode().getCategory().getName());
        response.setSuccess(log.isSuccess());
        response.setErrorCode(log.getErrorCode());
        response.setDurationMs(log.getDurationMs());
        response.setAttemptNumber(log.getAttemptNumber());
        response.setOccurredAt(log.getOccurredAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public boolean isSuccess() {
        return isSuccess;
    }

    public void setSuccess(boolean success) {
        isSuccess = success;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }
}