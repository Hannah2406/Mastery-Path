package com.masterypath.domain.repo;

import com.masterypath.domain.model.Node;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository public interface NodeRepository extends JpaRepository<Node, Long> {
    Optional<Node> findByExternalKey(String externalKey);

    List<Node> findByCategoryId(Long categoryId);

}

