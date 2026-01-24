package com.masterypath.api.paths.dto;

import com.masterypath.domain.model.Node;
import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.NodeStatus;

public class NodeResponse {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String externalUrl;
    private NodeStatus status;
    private Double masteryScore;

    public NodeResponse() {}

    public NodeResponse(Long id, String name, String description, String category,
                        String externalUrl, NodeStatus status, Double masteryScore) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.externalUrl = externalUrl;
        this.status = status;
        this.masteryScore = masteryScore;
    }

    public static NodeResponse from(Node node, UserSkill userSkill) {
        NodeStatus status = userSkill != null ? userSkill.getNodeStatus() : NodeStatus.LOCKED;
        Double score = userSkill != null ? userSkill.getMasteryScore() : 0.0;
        return new NodeResponse(
            node.getId(),
            node.getName(),
            node.getDescription(),
            node.getCategory().getName(),
            node.getExternalUrl(),
            status,
            score
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public NodeStatus getStatus() {
        return status;
    }

    public void setStatus(NodeStatus status) {
        this.status = status;
    }

    public Double getMasteryScore() {
        return masteryScore;
    }

    public void setMasteryScore(Double masteryScore) {
        this.masteryScore = masteryScore;
    }
}