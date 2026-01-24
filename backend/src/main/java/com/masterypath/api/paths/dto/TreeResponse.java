package com.masterypath.api.paths.dto;

import java.util.List;

public class TreeResponse {
    private Long pathId;
    private String pathName;
    private List<NodeResponse> nodes;
    private List<EdgeResponse> edges;

    public TreeResponse() {}

    public TreeResponse(Long pathId, String pathName, List<NodeResponse> nodes, List<EdgeResponse> edges) {
        this.pathId = pathId;
        this.pathName = pathName;
        this.nodes = nodes;
        this.edges = edges;
    }

    public Long getPathId() {
        return pathId;
    }

    public void setPathId(Long pathId) {
        this.pathId = pathId;
    }

    public String getPathName() {
        return pathName;
    }

    public void setPathName(String pathName) {
        this.pathName = pathName;
    }

    public List<NodeResponse> getNodes() {
        return nodes;
    }

    public void setNodes(List<NodeResponse> nodes) {
        this.nodes = nodes;
    }

    public List<EdgeResponse> getEdges() {
        return edges;
    }

    public void setEdges(List<EdgeResponse> edges) {
        this.edges = edges;
    }
}