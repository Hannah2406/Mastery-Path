package com.masterypath.api.ai.dto;

import java.util.List;

public class GeneratePathResponse {
    private List<NodeSuggestionDTO> suggestions;

    public List<NodeSuggestionDTO> getSuggestions() { return suggestions; }
    public void setSuggestions(List<NodeSuggestionDTO> suggestions) { this.suggestions = suggestions; }

    public static class NodeSuggestionDTO {
        private String name;
        private String description;
        private String category;
        private String resourceUrl;
        private List<Integer> prerequisites;

        public NodeSuggestionDTO() {}

        public NodeSuggestionDTO(String name, String description, String category, String resourceUrl, List<Integer> prerequisites) {
            this.name = name;
            this.description = description;
            this.category = category;
            this.resourceUrl = resourceUrl;
            this.prerequisites = prerequisites != null ? prerequisites : List.of();
        }

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
