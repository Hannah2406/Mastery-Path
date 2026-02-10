package com.masterypath.domain.model;

import java.io.Serializable;
import java.util.Objects;

public class MarketplacePathNodeId implements Serializable {
    private Long marketplacePathId;
    private Long nodeId;

    public MarketplacePathNodeId() {}

    public MarketplacePathNodeId(Long marketplacePathId, Long nodeId) {
        this.marketplacePathId = marketplacePathId;
        this.nodeId = nodeId;
    }

    public Long getMarketplacePathId() { return marketplacePathId; }
    public void setMarketplacePathId(Long marketplacePathId) { this.marketplacePathId = marketplacePathId; }
    public Long getNodeId() { return nodeId; }
    public void setNodeId(Long nodeId) { this.nodeId = nodeId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MarketplacePathNodeId that = (MarketplacePathNodeId) o;
        return Objects.equals(marketplacePathId, that.marketplacePathId) && Objects.equals(nodeId, that.nodeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(marketplacePathId, nodeId);
    }
}
