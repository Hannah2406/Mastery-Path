package com.masterypath.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "path_node")
@IdClass(PathNodeId.class)
public class PathNode {
    @Id
    @Column(name = "path_id")
    private Long pathId;

    @Id
    @Column(name = "node_id")
    private Long nodeId;

    @Column(name = "sequence_order")
    private int sequenceOrder;

    public PathNode() {}

    public PathNode(Long pathId, Long nodeId, int sequenceOrder) {
        this.pathId = pathId;
        this.nodeId = nodeId;
        this.sequenceOrder = sequenceOrder;
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

    public int getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(int sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }
}