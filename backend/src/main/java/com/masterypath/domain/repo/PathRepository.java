package com.masterypath.domain.repo;
import com.masterypath.domain.model.Path;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository public interface PathRepository extends JpaRepository<Path, Long> {
    Optional<Path> findByName(String name);
}
