package com.masterypath.api.paths.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CreatePathFromAIRequest {
    @NotBlank(message = "name is required")
    private String name;

    private String description;

    @NotEmpty(message = "suggestions are required")
    @Valid
    private List<NodeSuggestionItem> suggestions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<NodeSuggestionItem> getSuggestions() { return suggestions; }
    public void setSuggestions(List<NodeSuggestionItem> suggestions) { this.suggestions = suggestions; }

    public static class NodeSuggestionItem {
        private String name;
        private String description;
        private String category;
        private String resourceUrl;
        private List<Integer> prerequisites; // 0-based indices of units that must be done first (for branching/same-level)

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getResourceUrl() { return resourceUrl; }
        public void setResourceUrl(String resourceUrl) { this.resourceUrl = resourceUrl; }
        public List<Integer> getPrerequisites() { return prerequisites; }
        public void setPrerequisites(List<Integer> prerequisites) { this.prerequisites = prerequisites; }
    }
}
