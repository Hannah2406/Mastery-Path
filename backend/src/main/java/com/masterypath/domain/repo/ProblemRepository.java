package com.masterypath.domain.repo;

import com.masterypath.domain.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByNodeIdOrderByDifficultyAsc(Long nodeId);
    List<Problem> findByNodeIdOrderByDifficultyAscCreatedAtAsc(Long nodeId);
}
