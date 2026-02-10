package com.masterypath.domain.repo;

import com.masterypath.domain.model.MarketplacePathNode;
import com.masterypath.domain.model.MarketplacePathNodeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplacePathNodeRepository extends JpaRepository<MarketplacePathNode, MarketplacePathNodeId> {
    List<MarketplacePathNode> findByMarketplacePathIdOrderBySequenceOrder(Long marketplacePathId);

    @Query("SELECT mpn.nodeId FROM MarketplacePathNode mpn WHERE mpn.marketplacePathId = :pathId ORDER BY mpn.sequenceOrder")
    List<Long> findNodeIdsByMarketplacePathId(@Param("pathId") Long marketplacePathId);
}
