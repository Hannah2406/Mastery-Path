package com.masterypath.domain.repo;
import com.masterypath.domain.model.NodePrerequisite;
import com.masterypath.domain.model.NodePrerequisiteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository public interface NodePrerequisiteRepository extends JpaRepository<NodePrerequisite, NodePrerequisiteId> {
    List<NodePrerequisite> findByDependentNodeId(Long dependentNodeId);
    List<NodePrerequisite> findByPrerequisiteNodeId(Long prerequisiteNodeId);
    @Query("SELECT np.prerequisiteNodeId FROM NodePrerequisite np WHERE np.dependentNodeId = :nodeId")    List<Long> findPrerequisiteNodeIds(@Param("nodeId") Long nodeId);
    @Query("SELECT np.dependentNodeId FROM NodePrerequisite np WHERE np.prerequisiteNodeId = :nodeId")    List<Long> findDependentNodeIds(@Param("nodeId") Long nodeId);
}
