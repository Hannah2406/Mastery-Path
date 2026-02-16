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

    public List<Path> getAllPaths(Long userId) {
        if (userId == null) return List.of();
        return pathRepository.findByOwner_IdOrderByNameAsc(userId);
    }

    @Transactional
    public Path createPath(User owner, String name, String description) {
        if (owner == null) {
            throw new IllegalArgumentException("Path owner is required");
        }
        String baseName = name != null && !name.isBlank() ? name.trim() : "My Path";
        String pathName = baseName;
        int suffix = 1;
        while (pathRepository.findByOwner_IdAndName(owner.getId(), pathName).isPresent()) {
            pathName = baseName + " (" + (++suffix) + ")";
        }
        Path path = new Path(owner, pathName, description != null ? description.trim() : null);
        return pathRepository.save(path);
    }

    /** Create starter paths for a new user (Blind 75 and AMC8 with basic nodes). */
    @Transactional
    public void createStarterPaths(User user) {
        if (user == null) return;
        // Check if user already has paths
        if (!pathRepository.findByOwner_IdOrderByNameAsc(user.getId()).isEmpty()) {
            return; // User already has paths, don't create duplicates
        }

        // Find nodes by external key (these should exist from seed data)
        List<String> blind75Keys = List.of("lc-1", "lc-121", "lc-217", "lc-15", "lc-3", "lc-20", "lc-704", "lc-206", "lc-226", "lc-200", "lc-70", "lc-198");
        List<String> amc8Keys = List.of("amc8-arith", "amc8-pemdas", "amc8-frac", "amc8-shapes", "amc8-area");

        // Create Blind 75 path
        Path blind75 = createPath(user, "Blind 75", "Master essential coding interview patterns");
        int blind75Order = 0;
        for (String key : blind75Keys) {
            final int currentOrder = blind75Order;
            nodeRepository.findByExternalKey(key).ifPresent(node -> {
                pathNodeRepository.save(new PathNode(blind75.getId(), node.getId(), currentOrder));
            });
            blind75Order++;
        }

        // Create AMC8 path
        Path amc8 = createPath(user, "AMC8", "Competition math fundamentals for middle school");
        int amc8Order = 0;
        for (String key : amc8Keys) {
            final int currentOrder = amc8Order;
            nodeRepository.findByExternalKey(key).ifPresent(node -> {
                pathNodeRepository.save(new PathNode(amc8.getId(), node.getId(), currentOrder));
            });
            amc8Order++;
        }
    }

    public Optional<Path> getPathById(Long pathId, Long userId) {
        if (userId == null) return Optional.empty();
        return pathRepository.findByIdAndOwner_Id(pathId, userId);
    }

    @Transactional(readOnly = true)
    public Optional<PathStats> getPathStats(Long pathId, Long userId) {
        if (userId == null) return Optional.empty();
        Path path = pathRepository.findByIdAndOwner_Id(pathId, userId).orElse(null);
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
        if (userId == null) {
            throw new IllegalArgumentException("User must be authenticated to view path");
        }
        Path path = pathRepository.findByIdAndOwner_Id(pathId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Path not found or you don't have access: " + pathId));
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
