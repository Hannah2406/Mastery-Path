package com.masterypath.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "marketplace_path_node")
@IdClass(MarketplacePathNodeId.class)
public class MarketplacePathNode {
    @Id
    @Column(name = "marketplace_path_id")
    private Long marketplacePathId;

    @Id
    @Column(name = "node_id")
    private Long nodeId;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marketplace_path_id", insertable = false, updatable = false)
    private MarketplacePath marketplacePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", insertable = false, updatable = false)
    private Node node;

    public MarketplacePathNode() {}

    public MarketplacePathNode(Long marketplacePathId, Long nodeId, int sequenceOrder) {
        this.marketplacePathId = marketplacePathId;
        this.nodeId = nodeId;
        this.sequenceOrder = sequenceOrder;
    }

    public Long getMarketplacePathId() { return marketplacePathId; }
    public void setMarketplacePathId(Long marketplacePathId) { this.marketplacePathId = marketplacePathId; }
    public Long getNodeId() { return nodeId; }
    public void setNodeId(Long nodeId) { this.nodeId = nodeId; }
    public int getSequenceOrder() { return sequenceOrder; }
    public void setSequenceOrder(int sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    public MarketplacePath getMarketplacePath() { return marketplacePath; }
    public void setMarketplacePath(MarketplacePath marketplacePath) { this.marketplacePath = marketplacePath; }
    public Node getNode() { return node; }
    public void setNode(Node node) { this.node = node; }
}
