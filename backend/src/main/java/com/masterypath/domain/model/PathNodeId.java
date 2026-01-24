package com.masterypath.domain.model;

import java.io.Serializable;
import java.util.Objects;

public class PathNodeId implements Serializable {
    private Long pathId;
    private Long nodeId;

    public PathNodeId() {}

    public PathNodeId(Long pathId, Long nodeId) {
        this.pathId = pathId;
        this.nodeId = nodeId;
    }

    public Long getPathId() {
        return pathId;
    }

    public void setPathId(Long pathId) {
        this.pathId = pathId;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PathNodeId that = (PathNodeId) o;
        return Objects.equals(pathId, that.pathId) &&
               Objects.equals(nodeId, that.nodeId);
    }

    @Override public int hashCode() {
        return Objects.hash(pathId, nodeId);
    }
}
