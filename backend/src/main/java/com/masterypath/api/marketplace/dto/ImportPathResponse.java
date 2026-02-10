package com.masterypath.api.marketplace.dto;

public class ImportPathResponse {
    private Long pathId;
    private String pathName;

    public ImportPathResponse() {}

    public ImportPathResponse(Long pathId, String pathName) {
        this.pathId = pathId;
        this.pathName = pathName;
    }

    public Long getPathId() { return pathId; }
    public void setPathId(Long pathId) { this.pathId = pathId; }
    public String getPathName() { return pathName; }
    public void setPathName(String pathName) { this.pathName = pathName; }
}
