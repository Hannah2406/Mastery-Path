package com.masterypath.domain.repo;

import com.masterypath.domain.model.PerformanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository public interface PerformanceLogRepository extends JpaRepository<PerformanceLog, Long> {
    List<PerformanceLog> findByUserIdAndNodeIdOrderByOccurredAtDesc(Long userId, Long nodeId);

    @Query("SELECT COUNT(pl) FROM PerformanceLog pl WHERE pl.user.id = :userId AND pl.node.id = :nodeId")
    int countByUserIdAndNodeId(@Param("userId") Long userId, @Param("nodeId") Long nodeId);

    @Query("SELECT pl FROM PerformanceLog pl WHERE pl.user.id = :userId AND pl.occurredAt >= :since ORDER BY pl.occurredAt DESC")
    List<PerformanceLog> findByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    List<PerformanceLog> findByUserIdOrderByOccurredAtDesc(Long userId);

    @Query("SELECT pl FROM PerformanceLog pl WHERE pl.user.id = :userId ORDER BY pl.occurredAt DESC LIMIT :limit")
    List<PerformanceLog> findRecentByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
