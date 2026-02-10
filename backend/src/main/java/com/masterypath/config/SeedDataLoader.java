package com.masterypath.config;

import com.masterypath.domain.model.*;
import com.masterypath.domain.repo.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds MVP data only when using H2 (profile "h2"). When using default PostgreSQL, Flyway migrations
 * (V2, V7_1, V8) provide the same seed data so all instances share one database and one marketplace.
 */
@Component
@Order(1)
@org.springframework.context.annotation.Profile("h2")
public class SeedDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataLoader.class);
    private static final String DEMO_USER_EMAIL = "demo@masterypath.app";
    private static final String DEMO_USER_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoKeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // password: demo

    private final CategoryRepository categoryRepository;
    private final NodeRepository nodeRepository;
    private final PathRepository pathRepository;
    private final PathNodeRepository pathNodeRepository;
    private final NodePrerequisiteRepository nodePrerequisiteRepository;
    private final UserRepository userRepository;
    private final MarketplacePathRepository marketplacePathRepository;
    private final MarketplacePathNodeRepository marketplacePathNodeRepository;

    public SeedDataLoader(CategoryRepository categoryRepository, NodeRepository nodeRepository,
                          PathRepository pathRepository, PathNodeRepository pathNodeRepository,
                          NodePrerequisiteRepository nodePrerequisiteRepository,
                          UserRepository userRepository,
                          MarketplacePathRepository marketplacePathRepository,
                          MarketplacePathNodeRepository marketplacePathNodeRepository) {
        this.categoryRepository = categoryRepository;
        this.nodeRepository = nodeRepository;
        this.pathRepository = pathRepository;
        this.pathNodeRepository = pathNodeRepository;
        this.nodePrerequisiteRepository = nodePrerequisiteRepository;
        this.userRepository = userRepository;
        this.marketplacePathRepository = marketplacePathRepository;
        this.marketplacePathNodeRepository = marketplacePathNodeRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (pathRepository.count() > 0) {
            log.info("Seed data already present, skipping path/node seed.");
            seedDemoUserAndMarketplace();
            return;
        }
        log.info("Seeding MVP data (H2 file)...");

        // Categories for Blind 75
        Category array = saveCategory("Array", 0.03);
        Category twoPointers = saveCategory("Two Pointers", 0.03);
        Category slidingWindow = saveCategory("Sliding Window", 0.03);
        Category stack = saveCategory("Stack", 0.03);
        Category binarySearch = saveCategory("Binary Search", 0.03);
        Category linkedList = saveCategory("Linked List", 0.03);
        Category trees = saveCategory("Trees", 0.03);
        Category graphs = saveCategory("Graphs", 0.04);
        Category dp = saveCategory("Dynamic Programming", 0.05);
        // AMC8
        Category algebra = saveCategory("Algebra", 0.02);
        Category geometry = saveCategory("Geometry", 0.02);

        // Blind 75 nodes (subset for MVP)
        Node n1 = saveNode(array, "Two Sum", "Find two numbers that add up to target", "lc-1", "https://leetcode.com/problems/two-sum/");
        Node n2 = saveNode(array, "Best Time to Buy and Sell Stock", "Maximum profit from stock prices", "lc-121", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/");
        Node n3 = saveNode(array, "Contains Duplicate", "Check if array contains duplicates", "lc-217", null);
        Node n4 = saveNode(twoPointers, "3Sum", "Find all triplets that sum to zero", "lc-15", null);
        Node n5 = saveNode(slidingWindow, "Longest Substring Without Repeating", "Longest unique substring", "lc-3", null);
        Node n6 = saveNode(stack, "Valid Parentheses", "Check if brackets are balanced", "lc-20", null);
        Node n7 = saveNode(binarySearch, "Binary Search", "Basic binary search", "lc-704", null);
        Node n8 = saveNode(linkedList, "Reverse Linked List", "Reverse a singly linked list", "lc-206", null);
        Node n9 = saveNode(trees, "Invert Binary Tree", "Mirror a binary tree", "lc-226", null);
        Node n10 = saveNode(graphs, "Number of Islands", "Count islands in 2D grid", "lc-200", null);
        Node n11 = saveNode(dp, "Climbing Stairs", "Count ways to climb stairs", "lc-70", null);
        Node n12 = saveNode(dp, "House Robber", "Max money without adjacent houses", "lc-198", null);

        // AMC8 nodes
        Node a1 = saveNode(algebra, "Basic Arithmetic", "Addition, subtraction, multiplication, division", "amc8-arith", null);
        Node a2 = saveNode(algebra, "Order of Operations", "PEMDAS and expression evaluation", "amc8-pemdas", null);
        Node a3 = saveNode(algebra, "Fractions & Decimals", "Operations with fractions and decimals", "amc8-frac", null);
        Node g1 = saveNode(geometry, "Basic Shapes", "Properties of triangles, rectangles, circles", "amc8-shapes", null);
        Node g2 = saveNode(geometry, "Perimeter & Area", "Calculating perimeter and area", "amc8-area", null);

        // Paths
        Path blind75 = new Path("Blind 75", "Master essential coding interview patterns");
        blind75 = pathRepository.save(blind75);
        Path amc8 = new Path("AMC8", "Competition math fundamentals for middle school");
        amc8 = pathRepository.save(amc8);

        // Blind 75 path nodes and prerequisites
        int order = 0;
        pathNodeRepository.save(new PathNode(blind75.getId(), n1.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n2.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n3.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n4.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n5.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n6.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n7.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n8.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n9.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n10.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n11.getId(), order++));
        pathNodeRepository.save(new PathNode(blind75.getId(), n12.getId(), order++));

        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n3.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n4.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n5.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n6.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n7.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n1.getId(), n8.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n8.getId(), n9.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n9.getId(), n10.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n5.getId(), n11.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(n11.getId(), n12.getId()));

        // AMC8 path nodes and prerequisites
        order = 0;
        pathNodeRepository.save(new PathNode(amc8.getId(), a1.getId(), order++));
        pathNodeRepository.save(new PathNode(amc8.getId(), a2.getId(), order++));
        pathNodeRepository.save(new PathNode(amc8.getId(), a3.getId(), order++));
        pathNodeRepository.save(new PathNode(amc8.getId(), g1.getId(), order++));
        pathNodeRepository.save(new PathNode(amc8.getId(), g2.getId(), order++));
        nodePrerequisiteRepository.save(new NodePrerequisite(a1.getId(), a2.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(a2.getId(), a3.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(a1.getId(), g1.getId()));
        nodePrerequisiteRepository.save(new NodePrerequisite(g1.getId(), g2.getId()));

        log.info("MVP seed data loaded: 2 paths, {} nodes.", nodeRepository.count());
        seedDemoUserAndMarketplace();
    }

    private void seedDemoUserAndMarketplace() {
        User demoUser;
        if (userRepository.count() == 0) {
            demoUser = userRepository.save(new User(DEMO_USER_EMAIL, DEMO_USER_PASSWORD_HASH));
            log.info("Demo user created: {} (password: demo)", DEMO_USER_EMAIL);
        } else {
            demoUser = userRepository.findByEmail(DEMO_USER_EMAIL).orElse(null);
        }
        if (marketplacePathRepository.count() > 0) {
            return;
        }
        final User author = demoUser;
        if (author == null || pathRepository.count() == 0) {
            return;
        }
        log.info("Seeding marketplace with published paths...");
        for (String pathName : List.of("Blind 75", "AMC8")) {
            pathRepository.findByName(pathName).ifPresent(path -> {
                List<PathNode> pathNodes = pathNodeRepository.findByPathIdOrderBySequenceOrder(path.getId());
                if (pathNodes.isEmpty()) return;
                MarketplacePath mp = new MarketplacePath();
                mp.setAuthor(author);
                mp.setTitle(path.getName());
                mp.setDescription(path.getDescription() != null ? path.getDescription() : path.getName() + " - curated skill path");
                mp.setDifficulty("intermediate");
                mp.setEstimatedTimeMinutes(pathName.equals("Blind 75") ? 1200 : 600);
                mp.setTags(pathName.equals("Blind 75") ? "DSA,interview,leetcode" : "math,AMC8,competition");
                mp.setPriceCents(0);
                mp.setPaid(false);
                mp.setCurrency("USD");
                mp = marketplacePathRepository.save(mp);
                int order = 0;
                for (PathNode pn : pathNodes) {
                    marketplacePathNodeRepository.save(new MarketplacePathNode(mp.getId(), pn.getNodeId(), order++));
                }
            });
        }
        log.info("Marketplace seed complete: {} published paths.", marketplacePathRepository.count());
    }

    private Category saveCategory(String name, double decay) {
        return categoryRepository.save(new Category(name, decay));
    }

    private Node saveNode(Category category, String name, String description, String externalKey, String externalUrl) {
        return nodeRepository.save(new Node(category, name, description, externalKey, externalUrl));
    }
}
