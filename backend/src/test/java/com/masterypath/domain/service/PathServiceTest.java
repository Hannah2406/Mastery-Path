package com.masterypath.domain.service;

import com.masterypath.domain.model.*;
import com.masterypath.domain.model.enums.NodeStatus;
import com.masterypath.domain.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PathServiceTest {
    @Mock
    private PathRepository pathRepository;
    @Mock
    private PathNodeRepository pathNodeRepository;
    @Mock
    private NodeRepository nodeRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private NodePrerequisiteRepository nodePrerequisiteRepository;
    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private AIService aiService;
    @Mock
    private ProblemRepository problemRepository;
    private PathService pathService;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("test@example.com", "hashed");
        testUser.setId(1L);
        pathService = new PathService(
            pathRepository,
            pathNodeRepository,
            nodeRepository,
            categoryRepository,
            nodePrerequisiteRepository,
            userSkillRepository,
            aiService,
            problemRepository
        );
    }

    @Test
    void getAllPaths_returnsPaths() {
        Path path1 = new Path(testUser, "Blind 75", "Coding interview prep");
        path1.setId(1L);
        Path path2 = new Path(testUser, "AMC8", "Competition math");
        path2.setId(2L);
        when(pathRepository.findByOwner_IdOrderByNameAsc(1L)).thenReturn(List.of(path1, path2));
        List<Path> result = pathService.getAllPaths(1L);
        assertEquals(2, result.size());
        assertEquals("Blind 75", result.get(0).getName());
        assertEquals("AMC8", result.get(1).getName());
    }

    @Test
    void getAllPaths_withNullUserId_returnsEmpty() {
        List<Path> result = pathService.getAllPaths(null);
        assertTrue(result.isEmpty());
    }

    @Test
    void getPathById_withExistingId_returnsPath() {
        Path path = new Path(testUser, "Blind 75", "Coding interview prep");
        path.setId(1L);
        when(pathRepository.findByIdAndOwner_Id(1L, 1L)).thenReturn(Optional.of(path));
        Optional<Path> result = pathService.getPathById(1L, 1L);
        assertTrue(result.isPresent());
        assertEquals("Blind 75", result.get().getName());
    }

    @Test
    void getPathById_withNonExistentId_returnsEmpty() {
        when(pathRepository.findByIdAndOwner_Id(999L, 1L)).thenReturn(Optional.empty());
        Optional<Path> result = pathService.getPathById(999L, 1L);
        assertTrue(result.isEmpty());
    }

    @Test
    void getTreeForPath_withValidPath_returnsTreeData() {
        Path path = new Path(testUser, "Blind 75", "Coding interview prep");
        path.setId(1L);
        Category category = new Category("Array", 0.03);
        category.setId(1L);
        Node node1 = new Node(category, "Two Sum", "Find two numbers", "lc-1", "https://leetcode.com/problems/two-sum/");
        node1.setId(1L);
        Node node2 = new Node(category, "3Sum", "Find three numbers", "lc-15", "https://leetcode.com/problems/3sum/");
        node2.setId(2L);
        when(pathRepository.findByIdAndOwner_Id(1L, 1L)).thenReturn(Optional.of(path));
        when(pathNodeRepository.findNodeIdsByPathId(1L)).thenReturn(List.of(1L, 2L));
        when(nodeRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(node1, node2));
        when(nodePrerequisiteRepository.findAll()).thenReturn(
            List.of(new NodePrerequisite(1L, 2L))
        );
        PathService.TreeData result = pathService.getTreeForPath(1L, 1L);
        assertNotNull(result);
        assertEquals(path, result.path);
        assertEquals(2, result.nodes.size());
        assertEquals(1, result.edges.size());
        assertEquals(1L, result.edges.get(0).source);
        assertEquals(2L, result.edges.get(0).target);
    }

    @Test
    void getTreeForPath_withUser_returnsUserSkills() {
        Path path = new Path(testUser, "Blind 75", "Coding interview prep");
        path.setId(1L);
        Category category = new Category("Array", 0.03);
        category.setId(1L);
        Node node1 = new Node(category, "Two Sum", "Find two numbers", "lc-1", "https://leetcode.com/problems/two-sum/");
        node1.setId(1L);
        User user = new User("test@example.com", "hashedPassword");
        user.setId(1L);
        UserSkill skill = new UserSkill(user, node1);
        skill.setId(1L);
        skill.setNodeStatus(NodeStatus.MASTERED);
        skill.setMasteryScore(0.95);
        when(pathRepository.findByIdAndOwner_Id(1L, 1L)).thenReturn(Optional.of(path));
        when(pathNodeRepository.findNodeIdsByPathId(1L)).thenReturn(List.of(1L));
        when(nodeRepository.findAllById(List.of(1L))).thenReturn(List.of(node1));
        when(userSkillRepository.findByUserIdAndNodeIds(1L, List.of(1L))).thenReturn(List.of(skill));
        when(nodePrerequisiteRepository.findAll()).thenReturn(Collections.emptyList());
        PathService.TreeData result = pathService.getTreeForPath(1L, 1L);
        assertNotNull(result);
        assertTrue(result.userSkillMap.containsKey(1L));
        assertEquals(NodeStatus.MASTERED, result.userSkillMap.get(1L).getNodeStatus());
        assertEquals(0.95, result.userSkillMap.get(1L).getMasteryScore());
    }

    @Test
    void getTreeForPath_withNonExistentPath_throwsException() {
        when(pathRepository.findByIdAndOwner_Id(999L, 1L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> {
            pathService.getTreeForPath(999L, 1L);
        });
    }

    @Test
    void getTreeForPath_withNullUserId_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            pathService.getTreeForPath(1L, null);
        });
    }

    @Test
    void getTreeForPath_initializesEntryNodesAsAvailable() {
        Path path = new Path(testUser, "Blind 75", "Coding interview prep");
        path.setId(1L);
        Category category = new Category("Array", 0.03);
        category.setId(1L);
        Node entryNode = new Node(category, "Two Sum", "Entry node", "lc-1", "https://leetcode.com/problems/two-sum/");
        entryNode.setId(1L);
        when(pathRepository.findByIdAndOwner_Id(1L, 1L)).thenReturn(Optional.of(path));
        when(pathNodeRepository.findNodeIdsByPathId(1L)).thenReturn(List.of(1L));
        when(nodeRepository.findAllById(List.of(1L))).thenReturn(List.of(entryNode));
        when(userSkillRepository.findByUserIdAndNodeIds(1L, List.of(1L))).thenReturn(Collections.emptyList());
        when(nodePrerequisiteRepository.findAll()).thenReturn(Collections.emptyList());
        PathService.TreeData result = pathService.getTreeForPath(1L, 1L);
        assertTrue(result.userSkillMap.containsKey(1L));
        assertEquals(NodeStatus.AVAILABLE, result.userSkillMap.get(1L).getNodeStatus());
    }
}
