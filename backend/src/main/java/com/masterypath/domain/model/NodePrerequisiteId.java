package com.masterypath.domain.model;

import java.io.Serializable;
import java.util.Objects;

public class NodePrerequisiteId implements Serializable {
    private Long prerequisiteNodeId;
    private Long dependentNodeId;

    public NodePrerequisiteId() {}

    public NodePrerequisiteId(Long prerequisiteNodeId, Long dependentNodeId) {
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

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NodePrerequisiteId that = (NodePrerequisiteId) o;
        return Objects.equals(prerequisiteNodeId, that.prerequisiteNodeId) &&
               Objects.equals(dependentNodeId, that.dependentNodeId);
    }

    @Override public int hashCode() {
        return Objects.hash(prerequisiteNodeId, dependentNodeId);
    }
}
