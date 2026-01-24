package com.masterypath.api.logs.dto;

import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.NodeStatus;

import java.util.List;

public class LogResponse {
    private Long logId;
    private UserSkillDto userSkill;
    private List<Long> unlockedNodeIds;

    public LogResponse() {}

    public LogResponse(Long logId, UserSkillDto userSkill, List<Long> unlockedNodeIds) {
        this.logId = logId;
        this.userSkill = userSkill;
        this.unlockedNodeIds = unlockedNodeIds;
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public UserSkillDto getUserSkill() {
        return userSkill;
    }

    public void setUserSkill(UserSkillDto userSkill) {
        this.userSkill = userSkill;
    }

    public List<Long> getUnlockedNodeIds() {
        return unlockedNodeIds;
    }

    public void setUnlockedNodeIds(List<Long> unlockedNodeIds) {
        this.unlockedNodeIds = unlockedNodeIds;
    }

    public static class UserSkillDto {
        private Long nodeId;
        private double masteryScore;
        private NodeStatus nodeStatus;

        public UserSkillDto() {}

        public UserSkillDto(Long nodeId, double masteryScore, NodeStatus nodeStatus) {
            this.nodeId = nodeId;
            this.masteryScore = masteryScore;
            this.nodeStatus = nodeStatus;
        }

        public static UserSkillDto from(UserSkill skill) {
            return new UserSkillDto(
                skill.getNode().getId(),
                skill.getMasteryScore(),
                skill.getNodeStatus()
            );
        }

        public Long getNodeId() {
            return nodeId;
        }

        public void setNodeId(Long nodeId) {
            this.nodeId = nodeId;
        }

        public double getMasteryScore() {
            return masteryScore;
        }

        public void setMasteryScore(double masteryScore) {
            this.masteryScore = masteryScore;
        }

        public NodeStatus getNodeStatus() {
            return nodeStatus;
        }

        public void setNodeStatus(NodeStatus nodeStatus) {
            this.nodeStatus = nodeStatus;
        }
    }
}