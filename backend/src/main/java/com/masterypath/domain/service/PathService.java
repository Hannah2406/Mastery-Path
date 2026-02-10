package com.masterypath.domain.service;

import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service public class PathService {
    private static final int REVIEW_GRACE_DAYS = 7;
    private final PathRepository pathRepository;
    private final PathNodeRepository pathNodeRepository;
    private final NodeRepository nodeRepository;
    private final NodePrerequisiteRepository nodePrerequisiteRepository;
    private final UserSkillRepository userSkillRepository;

    public PathService(PathRepository pathRepository,
                       PathNodeRepository pathNodeRepository,
                       NodeRepository nodeRepository,
                       NodePrerequisiteRepository nodePrerequisiteRepository,
                       UserSkillRepository userSkillRepository) {
        this.pathRepository = pathRepository;
        this.pathNodeRepository = pathNodeRepository;
        this.nodeRepository = nodeRepository;
        this.nodePrerequisiteRepository = nodePrerequisiteRepository;
        this.userSkillRepository = userSkillRepository;
    }

    public List<Path> getAllPaths() {
        return pathRepository.findAll();
    }

    @Transactional
    public Path createPath(String name, String description) {
        String baseName = name != null && !name.isBlank() ? name.trim() : "My Path";
        String pathName = baseName;
        int suffix = 1;
        while (pathRepository.findByName(pathName).isPresent()) {
            pathName = baseName + " (" + (++suffix) + ")";
        }
        Path path = new Path(pathName, description != null ? description.trim() : null);
        return pathRepository.save(path);
    }

    public Optional<Path> getPathById(Long pathId) {
        return pathRepository.findById(pathId);
    }

    @Transactional(readOnly = true)
    public Optional<PathStats> getPathStats(Long pathId, Long userId) {
        Path path = pathRepository.findById(pathId).orElse(null);
        if (path == null) return Optional.empty();
        List<Long> nodeIds = pathNodeRepository.findNodeIdsByPathId(pathId);
        int totalNodes = nodeIds.size();
        if (totalNodes == 0) return Optional.of(new PathStats(totalNodes, 0, 0));
        if (userId == null) return Optional.of(new PathStats(totalNodes, 0, 0));
        List<UserSkill> skills = userSkillRepository.findByUserIdAndNodeIds(userId, nodeIds);
        int mastered = 0;
        int reviewDue = 0;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(REVIEW_GRACE_DAYS);
        for (UserSkill us : skills) {
            if (us.getNodeStatus() == NodeStatus.MASTERED) mastered++;
            if (us.getNodeStatus() == NodeStatus.DECAYING) reviewDue++;
            else if (us.getNodeStatus() == NodeStatus.MASTERED && us.getLastSuccessfulAt() != null
                && us.getLastSuccessfulAt().isBefore(cutoff)) reviewDue++;
        }
        return Optional.of(new PathStats(totalNodes, mastered, reviewDue));
    }

    @Transactional(readOnly = true)
    public List<UserSkill> getReviewQueue(Long pathId, Long userId, int limit) {
        if (pathId == null || userId == null) return List.of();
        List<Long> nodeIds = pathNodeRepository.findNodeIdsByPathId(pathId);
        if (nodeIds.isEmpty()) return List.of();
        List<UserSkill> skills = userSkillRepository.findByUserIdAndNodeIds(userId, nodeIds);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(REVIEW_GRACE_DAYS);
        List<UserSkill> due = skills.stream()
            .filter(us -> us.getNodeStatus() == NodeStatus.DECAYING
                || (us.getNodeStatus() == NodeStatus.MASTERED && us.getLastSuccessfulAt() != null
                    && us.getLastSuccessfulAt().isBefore(cutoff)))
            .sorted(Comparator
                .comparing(UserSkill::getNodeStatus, (a, b) -> a == NodeStatus.DECAYING && b != NodeStatus.DECAYING ? -1 : (a != NodeStatus.DECAYING && b == NodeStatus.DECAYING ? 1 : 0))
                .thenComparing(us -> us.getLastSuccessfulAt() == null ? LocalDateTime.MIN : us.getLastSuccessfulAt()))
            .limit(limit)
            .toList();
        return due;
    }

    @Transactional(readOnly = true)
    public TreeData getTreeForPath(Long pathId, Long userId) {
        Path path = pathRepository.findById(pathId)
            .orElseThrow(() -> new IllegalArgumentException("Path not found: " + pathId));
        List<Long> nodeIds = pathNodeRepository.findNodeIdsByPathId(pathId);
        List<Node> nodes = nodeRepository.findAllById(nodeIds);

        Map<Long, UserSkill> userSkillMap = new HashMap<>();
        if (userId != null) {
            List<UserSkill> userSkills = userSkillRepository.findByUserIdAndNodeIds(userId, nodeIds);
            userSkillMap = userSkills.stream()
                .collect(Collectors.toMap(us -> us.getNode().getId(), us -> us));
            // Initialize skills for entry nodes (nodes with no prerequisites in this path)
            initializeEntryNodes(userId, nodes, nodeIds, userSkillMap);
        }

        List<NodePrerequisite> allPrereqs = nodePrerequisiteRepository.findAll();
        Set<Long> nodeIdSet = new HashSet<>(nodeIds);
        List<EdgeData> edges = allPrereqs.stream()
            .filter(np -> nodeIdSet.contains(np.getPrerequisiteNodeId()) && nodeIdSet.contains(np.getDependentNodeId()))
            .map(np -> new EdgeData(np.getPrerequisiteNodeId(), np.getDependentNodeId()))
            .collect(Collectors.toList());

        return new TreeData(path, nodes, userSkillMap, edges);
    }

    private void initializeEntryNodes(Long userId, List<Node> nodes, List<Long> nodeIds,
                                      Map<Long, UserSkill> userSkillMap) {
        Set<Long> nodeIdSet = new HashSet<>(nodeIds);
        Set<Long> nodesWithPrereqs = nodePrerequisiteRepository.findAll().stream()
            .filter(np -> nodeIdSet.contains(np.getDependentNodeId()))
            .map(NodePrerequisite::getDependentNodeId)
            .collect(Collectors.toSet());

        for (Node node : nodes) {
            if (!nodesWithPrereqs.contains(node.getId()) && !userSkillMap.containsKey(node.getId())) {
                UserSkill skill = new UserSkill();
                skill.setNode(node);
                skill.setNodeStatus(NodeStatus.AVAILABLE);
                skill.setMasteryScore(0.0);
                userSkillMap.put(node.getId(), skill);
            }
        }
    }

    public static class TreeData {
        public final Path path;
        public final List<Node> nodes;
        public final Map<Long, UserSkill> userSkillMap;
        public final List<EdgeData> edges;

        public TreeData(Path path, List<Node> nodes, Map<Long, UserSkill> userSkillMap, List<EdgeData> edges) {
            this.path = path;
            this.nodes = nodes;
            this.userSkillMap = userSkillMap;
            this.edges = edges;
        }
    }

    public static class EdgeData {
        public final Long source;
        public final Long target;

        public EdgeData(Long source, Long target) {
            this.source = source;
            this.target = target;
        }
    }

    public static class PathStats {
        public final int totalNodes;
        public final int masteredCount;
        public final int reviewDueCount;

        public PathStats(int totalNodes, int masteredCount, int reviewDueCount) {
            this.totalNodes = totalNodes;
            this.masteredCount = masteredCount;
            this.reviewDueCount = reviewDueCount;
        }
    }
}
