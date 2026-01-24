package com.masterypath.domain.service;

import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.UserSkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service public class DecayService {
    private static final Logger log = LoggerFactory.getLogger(DecayService.class);
    private static final double DECAY_RATE_PER_DAY = 0.02;
    private static final double MASTERY_THRESHOLD = 0.8;
    private static final int GRACE_PERIOD_DAYS = 7;

    private final UserSkillRepository userSkillRepository;

    public DecayService(UserSkillRepository userSkillRepository) {
        this.userSkillRepository = userSkillRepository;
    }

    @Scheduled(cron = "0 0 2 * * *") // Run daily at 2 AM
    @Transactional public void applyDecay() {
        log.info("Starting mastery decay job");
        List<UserSkill> masteredSkills = userSkillRepository.findAllMasteredWithLastSuccess();
        int decayedCount = 0;
        for (UserSkill skill : masteredSkills) {
            if (shouldDecay(skill)) {
                applyDecayToSkill(skill);
                decayedCount++;
            }
        }
        log.info("Decay job complete. Processed {}skills, decayed {}", masteredSkills.size(), decayedCount);
    }

    private boolean shouldDecay(UserSkill skill) {
        if (skill.getLastSuccessfulAt() == null) {
            return false;
        }
        long daysSinceLastSuccess = ChronoUnit.DAYS.between(
            skill.getLastSuccessfulAt(),
            LocalDateTime.now()
        );
        return daysSinceLastSuccess > GRACE_PERIOD_DAYS;
    }

    private void applyDecayToSkill(UserSkill skill) {
        long daysSinceLastSuccess = ChronoUnit.DAYS.between(
            skill.getLastSuccessfulAt(),
            LocalDateTime.now()
        );
        long decayDays = daysSinceLastSuccess - GRACE_PERIOD_DAYS;
        double decayAmount = decayDays * DECAY_RATE_PER_DAY;
        double newScore = Math.max(0.0, skill.getMasteryScore() - decayAmount);
        skill.setMasteryScore(newScore);
        if (newScore < MASTERY_THRESHOLD && skill.getNodeStatus() == NodeStatus.MASTERED) {
            skill.setNodeStatus(NodeStatus.DECAYING);
        }
        userSkillRepository.save(skill);
        log.debug("Decayed skill {} for user {}: {}-> {}",
            skill.getNode().getId(),
            skill.getUser().getId(),
            skill.getMasteryScore() + decayAmount,
            newScore
        );
    }

    // Manual trigger for testing
    public int triggerDecay() {
        List<UserSkill> masteredSkills = userSkillRepository.findAllMasteredWithLastSuccess();
        int decayedCount = 0;
        for (UserSkill skill : masteredSkills) {
            if (shouldDecay(skill)) {
                applyDecayToSkill(skill);
                decayedCount++;
            }
        }
        return decayedCount;
    }
}
