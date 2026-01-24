package com.masterypath.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "node_prerequisite")
@IdClass(NodePrerequisiteId.class)
public class NodePrerequisite {
    @Id
    @Column(name = "prerequisite_node_id")
    private Long prerequisiteNodeId;

    @Id
    @Column(name = "dependent_node_id")
    private Long dependentNodeId;

    public NodePrerequisite() {}

    public NodePrerequisite(Long prerequisiteNodeId, Long dependentNodeId) {
        this.prerequisiteNodeId = prerequisiteNodeId;
        this.dependentNodeId = dependentNodeId;
    }

    public Long getPrerequisiteNodeId() {
        return prerequisiteNodeId;
    }

    public void setPrerequisiteNodeId(Long prerequisiteNodeId) {
        this.prerequisiteNodeId = prerequisiteNodeId;
    }

    public Long getDependentNodeId() {
        return dependentNodeId;
    }

    public void setDependentNodeId(Long dependentNodeId) {
        this.dependentNodeId = dependentNodeId;
    }
}