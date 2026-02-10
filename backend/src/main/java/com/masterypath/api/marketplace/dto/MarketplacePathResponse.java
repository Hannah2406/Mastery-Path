package com.masterypath.api.marketplace.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public class MarketplacePathResponse {
    private Long id;
    private String title;
    private String description;
    private String difficulty;
    private Integer estimatedTimeMinutes;
    private String tags;
    private int importCount;
    private LocalDateTime createdAt;
    private String authorEmail;
    private int nodeCount;
    private List<Long> nodeIds;
    private Integer priceCents;
    private boolean isPaid;
    private String currency;
    private boolean hasPurchased;

    public MarketplacePathResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }
    public int getNodeCount() { return nodeCount; }
    public void setNodeCount(int nodeCount) { this.nodeCount = nodeCount; }
    public List<Long> getNodeIds() { return nodeIds; }
    public void setNodeIds(List<Long> nodeIds) { this.nodeIds = nodeIds; }
    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
    @JsonProperty("isPaid")
    public boolean isPaid() { return isPaid; }
    public void setPaid(boolean isPaid) { this.isPaid = isPaid; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    @JsonProperty("hasPurchased")
    public boolean isHasPurchased() { return hasPurchased; }
    public void setHasPurchased(boolean hasPurchased) { this.hasPurchased = hasPurchased; }
}
