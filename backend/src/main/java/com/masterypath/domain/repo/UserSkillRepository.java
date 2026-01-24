package com.masterypath.domain.repo;

import com.masterypath.domain.model.UserSkill;
import com.masterypath.domain.model.enums.NodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    Optional<UserSkill> findByUserIdAndNodeId(Long userId, Long nodeId);

    List<UserSkill> findByUserId(Long userId);

    List<UserSkill> findByUserIdAndNodeStatus(Long userId, NodeStatus nodeStatus);

    @Query("SELECT us FROM UserSkill us WHERE us.user.id = :userId AND us.node.id IN :nodeIds")
    List<UserSkill> findByUserIdAndNodeIds(@Param("userId") Long userId, @Param("nodeIds") List<Long> nodeIds);

    @Query("SELECT us FROM UserSkill us WHERE us.nodeStatus = 'MASTERED' AND us.lastSuccessfulAt IS NOT NULL")
    List<UserSkill> findAllMasteredWithLastSuccess();
}
