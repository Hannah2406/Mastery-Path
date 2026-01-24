package com.masterypath.domain.service;
import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.ErrorCode;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
@Service public class MasteryService {
    private static final double SUCCESS_DELTA = 0.15;
    private static final double EXECUTION_PENALTY = -0.05;
    private static final double FORGOT_PENALTY = -0.15;
    private static final double CONCEPT_PENALTY = -0.25;
    private static final double MASTERY_THRESHOLD = 0.8;
    private final UserSkillRepository userSkillRepository;
    private final PerformanceLogRepository performanceLogRepository;
    private final NodeRepository nodeRepository;
    private final UnlockEngine unlockEngine;
    public MasteryService(UserSkillRepository userSkillRepository,                          PerformanceLogRepository performanceLogRepository,                          NodeRepository nodeRepository,                          UnlockEngine unlockEngine) {
        this.userSkillRepository = userSkillRepository;
        this.performanceLogRepository = performanceLogRepository;
        this.nodeRepository = nodeRepository;
        this.unlockEngine = unlockEngine;

    }
    @Transactional public ProcessLogResult processLog(User user, Long nodeId, boolean isSuccess,                                        ErrorCode errorCode, Integer durationMs) {
        Node node = nodeRepository.findById(nodeId)            .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));
        UserSkill skill = findOrCreateUserSkill(user, node);
        PerformanceLog log = createPerformanceLog(user, node, isSuccess, errorCode, durationMs, skill);
        applyDelta(skill, isSuccess, errorCode);
        updateStatus(skill);
        userSkillRepository.save(skill);
        List<Long> unlockedNodeIds = unlockEngine.checkUnlocks(user, node);
        return new ProcessLogResult(log.getId(), skill, unlockedNodeIds);

    }
    private UserSkill findOrCreateUserSkill(User user, Node node) {
        return userSkillRepository.findByUserIdAndNodeId(user.getId(), node.getId())            .orElseGet(() -> {
            UserSkill newSkill = new UserSkill(user, node);
            newSkill.setNodeStatus(NodeStatus.AVAILABLE);
            return newSkill;

        }
        );

    }
    private PerformanceLog createPerformanceLog(User user, Node node, boolean isSuccess,                                                 ErrorCode errorCode, Integer durationMs,                                                 UserSkill skill) {
        int attemptNumber = performanceLogRepository.countByUserIdAndNodeId(user.getId(), node.getId()) + 1;
        PerformanceLog log = new PerformanceLog(user, node, isSuccess, errorCode, durationMs);
        log.setAttemptNumber(attemptNumber);
        return performanceLogRepository.save(log);

    }
    private void applyDelta(UserSkill skill, boolean isSuccess, ErrorCode errorCode) {
        double delta = isSuccess ? SUCCESS_DELTA : getPenalty(errorCode);
        double newScore = skill.getMasteryScore() + delta;
        skill.setMasteryScore(clamp(newScore));
        skill.setLastPracticedAt(LocalDateTime.now());
        if (isSuccess) {
            skill.setLastSuccessfulAt(LocalDateTime.now());

        }

    }
    private double getPenalty(ErrorCode errorCode) {
        if (errorCode == null) {
            return FORGOT_PENALTY;

        }
        return switch (errorCode) {
            case EXECUTION -> EXECUTION_PENALTY;
            case FORGOT -> FORGOT_PENALTY;
            case CONCEPT -> CONCEPT_PENALTY;

        }
        ;

    }
    private void updateStatus(UserSkill skill) {
        if (skill.getMasteryScore() >= MASTERY_THRESHOLD) {
            skill.setNodeStatus(NodeStatus.MASTERED);

        }
        else if (skill.getNodeStatus() == NodeStatus.MASTERED) {
            skill.setNodeStatus(NodeStatus.DECAYING);

        }
        else if (skill.getNodeStatus() == NodeStatus.LOCKED) {
            skill.setNodeStatus(NodeStatus.AVAILABLE);

        }

    }
    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));

    }
    public static class ProcessLogResult {
        public final Long logId;
        public final UserSkill userSkill;
        public final List<Long> unlockedNodeIds;
        public ProcessLogResult(Long logId, UserSkill userSkill, List<Long> unlockedNodeIds) {
            this.logId = logId;
            this.userSkill = userSkill;
            this.unlockedNodeIds = unlockedNodeIds;

        }

    }
}
