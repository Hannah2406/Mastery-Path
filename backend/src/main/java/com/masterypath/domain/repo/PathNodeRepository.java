package com.masterypath.domain.repo;

import com.masterypath.domain.model.PathNode;

import com.masterypath.domain.model.PathNodeId;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository public interface PathNodeRepository extends JpaRepository<PathNode, PathNodeId> {
    List<PathNode> findByPathIdOrderBySequenceOrder(Long pathId);

    @Query("SELECT pn.nodeId FROM PathNode pn WHERE pn.pathId = :pathId ORDER BY pn.sequenceOrder")    List<Long> findNodeIdsByPathId(@Param("pathId") Long pathId);

}

