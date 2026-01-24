package com.masterypath.domain.model;

import com.masterypath.domain.model.enums.ErrorCode;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_log")
public class PerformanceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "node_id", nullable = false)
    private Node node;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt = LocalDateTime.now();

    @Column(name = "is_success", nullable = false)
    private boolean isSuccess;

    @Enumerated(EnumType.STRING)
    @Column(name = "error_code")
    private ErrorCode errorCode;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "attempt_number")
    private Integer attemptNumber;

    @ManyToOne
    @JoinColumn(name = "correction_of_id")
    private PerformanceLog correctionOf;

    public PerformanceLog() {}

    public PerformanceLog(User user, Node node, boolean isSuccess, ErrorCode errorCode, Integer durationMs) {
        this.user = user;
        this.node = node;
        this.occurredAt = LocalDateTime.now();
        this.isSuccess = isSuccess;
        this.errorCode = errorCode;
        this.durationMs = durationMs;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Node getNode() {
        return node;
    }

    public void setNode(Node node) {
        this.node = node;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
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

    public PerformanceLog getCorrectionOf() {
        return correctionOf;
    }

    public void setCorrectionOf(PerformanceLog correctionOf) {
        this.correctionOf = correctionOf;
    }
}