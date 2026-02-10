package com.masterypath.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marketplace_path")
public class MarketplacePath {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String difficulty = "intermediate";

    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

    @Column(length = 512)
    private String tags;

    @Column(name = "import_count", nullable = false)
    private int importCount = 0;

    @Column(name = "price_cents")
    private Integer priceCents = 0;

    @Column(name = "is_paid", nullable = false)
    private boolean isPaid = false;

    @Column(length = 3)
    private String currency = "USD";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "marketplacePath", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceOrder")
    private List<MarketplacePathNode> nodes = new ArrayList<>();

    public MarketplacePath() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Integer getEstimatedTimeMinutes() { return estimatedTimeMinutes; }
    public void setEstimatedTimeMinutes(Integer estimatedTimeMinutes) { this.estimatedTimeMinutes = estimatedTimeMinutes; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public int getImportCount() { return importCount; }
    public void setImportCount(int importCount) { this.importCount = importCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
    public boolean isPaid() { return isPaid; }
    public void setPaid(boolean isPaid) { this.isPaid = isPaid; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public List<MarketplacePathNode> getNodes() { return nodes; }
    public void setNodes(List<MarketplacePathNode> nodes) { this.nodes = nodes; }
}
