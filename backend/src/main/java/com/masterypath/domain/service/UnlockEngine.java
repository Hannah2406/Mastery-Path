package com.masterypath.domain.service;
import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.*;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
@Service public class UnlockEngine {
    private static final double MASTERY_THRESHOLD = 0.8;
    private final NodePrerequisiteRepository nodePrerequisiteRepository;
    private final NodeRepository nodeRepository;
    private final UserSkillRepository userSkillRepository;
    public UnlockEngine(NodePrerequisiteRepository nodePrerequisiteRepository,                        NodeRepository nodeRepository,                        UserSkillRepository userSkillRepository) {
        this.nodePrerequisiteRepository = nodePrerequisiteRepository;
        this.nodeRepository = nodeRepository;
        this.userSkillRepository = userSkillRepository;

    }
    public List<Long> checkUnlocks(User user, Node completedNode) {
        List<Long> unlockedNodeIds = new ArrayList<>();
        List<Long> childNodeIds = nodePrerequisiteRepository.findDependentNodeIds(completedNode.getId());
        for (Long childNodeId : childNodeIds) {
            if (allParentsMastered(user, childNodeId)) {
                boolean unlocked = unlockNode(user, childNodeId);
                if (unlocked) {
                    unlockedNodeIds.add(childNodeId);

                }

            }

        }
        return unlockedNodeIds;

    }
    private boolean allParentsMastered(User user, Long nodeId) {
        List<Long> parentNodeIds = nodePrerequisiteRepository.findPrerequisiteNodeIds(nodeId);
        if (parentNodeIds.isEmpty()) {
            return true;

        }
        for (Long parentNodeId : parentNodeIds) {
            UserSkill parentSkill = userSkillRepository.findByUserIdAndNodeId(user.getId(), parentNodeId)                .orElse(null);
            if (parentSkill == null || parentSkill.getMasteryScore() < MASTERY_THRESHOLD) {
                return false;

            }

        }
        return true;

    }
    private boolean unlockNode(User user, Long nodeId) {
        UserSkill skill = userSkillRepository.findByUserIdAndNodeId(user.getId(), nodeId)            .orElse(null);
        if (skill == null) {
            Node node = nodeRepository.findById(nodeId).orElse(null);
            if (node == null) {
                return false;

            }
            skill = new UserSkill(user, node);
            skill.setNodeStatus(NodeStatus.AVAILABLE);
            userSkillRepository.save(skill);
            return true;

        }
        if (skill.getNodeStatus() == NodeStatus.LOCKED) {
            skill.setNodeStatus(NodeStatus.AVAILABLE);
            userSkillRepository.save(skill);
            return true;

        }
        return false;

    }
}
