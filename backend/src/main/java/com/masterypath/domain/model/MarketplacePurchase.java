package com.masterypath.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketplace_purchase", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "marketplace_path_id"})
})
public class MarketplacePurchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "marketplace_path_id", nullable = false)
    private MarketplacePath marketplacePath;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt = LocalDateTime.now();

    public MarketplacePurchase() {}

    public MarketplacePurchase(User user, MarketplacePath marketplacePath, Integer priceCents) {
        this.user = user;
        this.marketplacePath = marketplacePath;
        this.priceCents = priceCents;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public MarketplacePath getMarketplacePath() { return marketplacePath; }
    public void setMarketplacePath(MarketplacePath marketplacePath) { this.marketplacePath = marketplacePath; }
    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }
}
