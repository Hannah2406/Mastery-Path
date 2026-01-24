package com.masterypath.domain.service;

import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service public class PathService {
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

    public Optional<Path> getPathById(Long pathId) {
        return pathRepository.findById(pathId);
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
}
