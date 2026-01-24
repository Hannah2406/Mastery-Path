package com.masterypath.domain.repo;

import com.masterypath.domain.model.MaintenanceTask;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository public interface MaintenanceTaskRepository extends JpaRepository<MaintenanceTask, Long> {
    @Query("SELECT mt FROM MaintenanceTask mt WHERE mt.userSkill.user.id = :userId AND mt.completedAt IS NULL")    List<MaintenanceTask> findPendingByUserId(@Param("userId") Long userId);

    @Query("SELECT mt FROM MaintenanceTask mt WHERE mt.userSkill.id = :userSkillId AND mt.completedAt IS NULL")    List<MaintenanceTask> findPendingByUserSkillId(@Param("userSkillId") Long userSkillId);

}

