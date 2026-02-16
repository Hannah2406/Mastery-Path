package com.masterypath.domain.repo;
import com.masterypath.domain.model.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository public interface PathRepository extends JpaRepository<Path, Long> {
    List<Path> findByOwner_IdOrderByNameAsc(Long userId);
    Optional<Path> findByOwner_IdAndName(Long userId, String name);
    Optional<Path> findByIdAndOwner_Id(Long pathId, Long userId);
}
