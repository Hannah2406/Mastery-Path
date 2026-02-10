package com.masterypath.domain.repo;

import com.masterypath.domain.model.MarketplacePurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MarketplacePurchaseRepository extends JpaRepository<MarketplacePurchase, Long> {
    Optional<MarketplacePurchase> findByUser_IdAndMarketplacePath_Id(Long userId, Long marketplacePathId);
    boolean existsByUser_IdAndMarketplacePath_Id(Long userId, Long marketplacePathId);
}
