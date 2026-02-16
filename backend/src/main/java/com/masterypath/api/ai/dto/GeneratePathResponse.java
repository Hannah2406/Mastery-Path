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
        
        public NodeSuggestionDTO(String name, String description, String category) {
            this.name = name;
            this.description = description;
            this.category = category;
        }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }
}
