package com.masterypath.domain.repo;

import com.masterypath.domain.model.MarketplacePath;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplacePathRepository extends JpaRepository<MarketplacePath, Long> {
    List<MarketplacePath> findByAuthor_IdOrderByCreatedAtDesc(Long authorUserId);

    @Query("SELECT mp FROM MarketplacePath mp ORDER BY mp.createdAt DESC")
    List<MarketplacePath> findAllOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT mp FROM MarketplacePath mp ORDER BY mp.importCount DESC")
    List<MarketplacePath> findAllOrderByImportCountDesc(Pageable pageable);

    @Query("SELECT mp FROM MarketplacePath mp WHERE (:tag IS NULL OR LOWER(mp.tags) LIKE LOWER(CONCAT('%', :tag, '%'))) AND (:difficulty IS NULL OR mp.difficulty = :difficulty) ORDER BY mp.createdAt DESC")
    List<MarketplacePath> findByFiltersOrderByNewest(@Param("tag") String tag, @Param("difficulty") String difficulty, Pageable pageable);

    @Query("SELECT mp FROM MarketplacePath mp WHERE (:tag IS NULL OR LOWER(mp.tags) LIKE LOWER(CONCAT('%', :tag, '%'))) AND (:difficulty IS NULL OR mp.difficulty = :difficulty) ORDER BY mp.importCount DESC")
    List<MarketplacePath> findByFiltersOrderByImports(@Param("tag") String tag, @Param("difficulty") String difficulty, Pageable pageable);
}
