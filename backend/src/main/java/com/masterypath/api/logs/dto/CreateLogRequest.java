package com.masterypath.api.logs.dto;

import com.masterypath.domain.model.enums.ErrorCode;
import jakarta.validation.constraints.NotNull;

public class CreateLogRequest {
    @NotNull(message = "Node ID is required")
    private Long nodeId;

    @NotNull(message = "Success flag is required")
    private Boolean isSuccess;

    private ErrorCode errorCode;

    private Integer durationMs;

    public CreateLogRequest() {}

    public CreateLogRequest(Long nodeId, Boolean isSuccess, ErrorCode errorCode, Integer durationMs) {
        this.nodeId = nodeId;
        this.isSuccess = isSuccess;
        this.errorCode = errorCode;
        this.durationMs = durationMs;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Boolean getIsSuccess() {
        return isSuccess;
    }

    public void setIsSuccess(Boolean isSuccess) {
        this.isSuccess = isSuccess;
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
}