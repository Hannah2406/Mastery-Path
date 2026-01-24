package com.masterypath.domain.service;

import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.ErrorCode;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.NodeRepository;
import com.masterypath.domain.repo.PerformanceLogRepository;
import com.masterypath.domain.repo.UserSkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MasteryServiceTest {
    @Mock
    private PerformanceLogRepository performanceLogRepository;
    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private NodeRepository nodeRepository;
    @Mock
    private UnlockEngine unlockEngine;
    @InjectMocks
    private MasteryService masteryService;
    private User testUser;
    private Node testNode;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Test Category");
        testNode = new Node();
        testNode.setId(1L);
        testNode.setName("Test Node");
        testNode.setCategory(testCategory);
    }

    private void setupCommonMocks() {
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(testNode));
        when(performanceLogRepository.countByUserIdAndNodeId(anyLong(), anyLong())).thenReturn(0);
        when(performanceLogRepository.save(any())).thenAnswer(inv -> {
            PerformanceLog log = inv.getArgument(0);
            log.setId(1L);
            return log;
        });
        when(userSkillRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(unlockEngine.checkUnlocks(any(), any())).thenReturn(Collections.emptyList());
    }

    @Test
    void processLog_successIncreasesMasteryScore() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.5);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, true, null, 5000
        );
        // Assert
        assertEquals(0.65, result.userSkill.getMasteryScore(), 0.001);
        assertEquals(NodeStatus.AVAILABLE, result.userSkill.getNodeStatus());
    }

    @Test
    void processLog_successAchievesMastery() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.7);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, true, null, 5000
        );
        // Assert
        assertEquals(0.85, result.userSkill.getMasteryScore(), 0.001);
        assertEquals(NodeStatus.MASTERED, result.userSkill.getNodeStatus());
    }

    @Test
    void processLog_executionErrorAppliesSmallPenalty() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.5);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, false, ErrorCode.EXECUTION, 5000
        );
        // Assert
        assertEquals(0.45, result.userSkill.getMasteryScore(), 0.001);
    }

    @Test
    void processLog_forgotErrorAppliesMediumPenalty() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.5);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, false, ErrorCode.FORGOT, 5000
        );
        // Assert
        assertEquals(0.35, result.userSkill.getMasteryScore(), 0.001);
    }

    @Test
    void processLog_conceptErrorAppliesLargePenalty() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.5);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, false, ErrorCode.CONCEPT, 5000
        );
        // Assert
        assertEquals(0.25, result.userSkill.getMasteryScore(), 0.001);
    }

    @Test
    void processLog_masteryScoreNeverGoesBelowZero() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.1);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, false, ErrorCode.CONCEPT, 5000
        );
        // Assert
        assertEquals(0.0, result.userSkill.getMasteryScore(), 0.001);
    }

    @Test
    void processLog_masteryScoreNeverGoesAboveOne() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.95);
        existingSkill.setNodeStatus(NodeStatus.MASTERED);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, true, null, 5000
        );
        // Assert
        assertEquals(1.0, result.userSkill.getMasteryScore(), 0.001);
    }

    @Test
    void processLog_createsNewUserSkillIfNotExists() {
        // Arrange
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.empty());
        // Act
        MasteryService.ProcessLogResult result = masteryService.processLog(
            testUser, 1L, true, null, 5000
        );
        // Assert
        assertEquals(0.15, result.userSkill.getMasteryScore(), 0.001);
        assertEquals(NodeStatus.AVAILABLE, result.userSkill.getNodeStatus());
    }

    @Test
    void processLog_throwsExceptionForInvalidNode() {
        // Arrange
        when(nodeRepository.findById(999L)).thenReturn(Optional.empty());
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            masteryService.processLog(testUser, 999L, true, null, 5000)
        );
    }

    @Test
    void processLog_createsPerformanceLog() {
        // Arrange
        UserSkill existingSkill = new UserSkill();
        existingSkill.setUser(testUser);
        existingSkill.setNode(testNode);
        existingSkill.setMasteryScore(0.5);
        existingSkill.setNodeStatus(NodeStatus.AVAILABLE);
        setupCommonMocks();
        when(userSkillRepository.findByUserIdAndNodeId(testUser.getId(), testNode.getId()))
            .thenReturn(Optional.of(existingSkill));
        // Act
        masteryService.processLog(testUser, 1L, true, null, 5000);
        // Assert
        ArgumentCaptor<PerformanceLog> captor = ArgumentCaptor.forClass(PerformanceLog.class);
        verify(performanceLogRepository).save(captor.capture());
        PerformanceLog savedLog = captor.getValue();
        assertEquals(testUser, savedLog.getUser());
        assertEquals(testNode, savedLog.getNode());
        assertTrue(savedLog.isSuccess());
        assertNull(savedLog.getErrorCode());
        assertEquals(5000, savedLog.getDurationMs());
    }
}
