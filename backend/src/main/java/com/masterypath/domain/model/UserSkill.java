package com.masterypath.domain.model;

import com.masterypath.domain.model.enums.NodeStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_skill", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "node_id"})
})
public class UserSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "node_id", nullable = false)
    private Node node;

    @Column(name = "mastery_score", nullable = false)
    private double masteryScore = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_status", nullable = false)
    private NodeStatus nodeStatus = NodeStatus.LOCKED;

    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt;

    @Column(name = "last_successful_at")
    private LocalDateTime lastSuccessfulAt;

    public UserSkill() {}

    public UserSkill(User user, Node node) {
        this.user = user;
        this.node = node;
        this.masteryScore = 0.0;
        this.nodeStatus = NodeStatus.LOCKED;
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

    public double getMasteryScore() {
        return masteryScore;
    }

    public void setMasteryScore(double masteryScore) {
        this.masteryScore = Math.max(0.0, Math.min(1.0, masteryScore));
    }

    public NodeStatus getNodeStatus() {
        return nodeStatus;
    }

    public void setNodeStatus(NodeStatus nodeStatus) {
        this.nodeStatus = nodeStatus;
    }

    public LocalDateTime getLastPracticedAt() {
        return lastPracticedAt;
    }

    public void setLastPracticedAt(LocalDateTime lastPracticedAt) {
        this.lastPracticedAt = lastPracticedAt;
    }

    public LocalDateTime getLastSuccessfulAt() {
        return lastSuccessfulAt;
    }

    public void setLastSuccessfulAt(LocalDateTime lastSuccessfulAt) {
        this.lastSuccessfulAt = lastSuccessfulAt;
    }
}