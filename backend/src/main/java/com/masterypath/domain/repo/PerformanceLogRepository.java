package com.masterypath.domain.repo;

import com.masterypath.domain.model.PerformanceLog;
import org.springframework.data.domain.Pageable;
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

    List<PerformanceLog> findByUserIdOrderByOccurredAtDesc(Long userId, Pageable pageable);

    @Query(value = "SELECT DATE(occurred_at) as date, COUNT(*) as count " +
           "FROM performance_log " +
           "WHERE user_id = :userId " +
           "AND occurred_at >= :since " +
           "GROUP BY DATE(occurred_at) " +
           "ORDER BY date ASC", nativeQuery = true)
    List<Object[]> findDailyCountsByUserIdSince(@Param("userId") Long userId, @Param("since") java.time.LocalDate since);
}
