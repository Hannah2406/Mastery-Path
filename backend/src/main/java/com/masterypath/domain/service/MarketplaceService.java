package com.masterypath.domain.service;

import com.masterypath.domain.model.*;
import com.masterypath.domain.repo.*;
import com.masterypath.domain.service.AIService.PathNodeSuggestion;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class MarketplaceService {
    private final MarketplacePathRepository marketplacePathRepository;
    private final MarketplacePathNodeRepository marketplacePathNodeRepository;
    private final PathRepository pathRepository;
    private final PathNodeRepository pathNodeRepository;
    private final NodeRepository nodeRepository;
    private final NodePrerequisiteRepository nodePrerequisiteRepository;
    private final MarketplacePurchaseRepository marketplacePurchaseRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AIService aiService;
    private final CategoryRepository categoryRepository;

    public MarketplaceService(MarketplacePathRepository marketplacePathRepository,
                              MarketplacePathNodeRepository marketplacePathNodeRepository,
                              PathRepository pathRepository,
                              PathNodeRepository pathNodeRepository,
                              NodeRepository nodeRepository,
                              NodePrerequisiteRepository nodePrerequisiteRepository,
                              MarketplacePurchaseRepository marketplacePurchaseRepository,
                              UserRepository userRepository,
                              AuthService authService,
                              AIService aiService,
                              CategoryRepository categoryRepository) {
        this.marketplacePathRepository = marketplacePathRepository;
        this.marketplacePathNodeRepository = marketplacePathNodeRepository;
        this.pathRepository = pathRepository;
        this.pathNodeRepository = pathNodeRepository;
        this.nodeRepository = nodeRepository;
        this.nodePrerequisiteRepository = nodePrerequisiteRepository;
        this.marketplacePurchaseRepository = marketplacePurchaseRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.aiService = aiService;
        this.categoryRepository = categoryRepository;
    }

    /** Tree preview for marketplace path (read-only: nodes + edges, no user progress). */
    @Transactional(readOnly = true)
    public TreePreview getTreePreview(Long marketplacePathId) {
        MarketplacePath mp = marketplacePathRepository.findById(marketplacePathId)
            .orElseThrow(() -> new IllegalArgumentException("Published path not found: " + marketplacePathId));
        List<Long> nodeIds = marketplacePathNodeRepository.findNodeIdsByMarketplacePathId(marketplacePathId);
        List<Node> nodes = nodeRepository.findAllById(nodeIds);
        Set<Long> nodeIdSet = new HashSet<>(nodeIds);
        List<PathService.EdgeData> edges = nodePrerequisiteRepository.findAll().stream()
            .filter(np -> nodeIdSet.contains(np.getPrerequisiteNodeId()) && nodeIdSet.contains(np.getDependentNodeId()))
            .map(np -> new PathService.EdgeData(np.getPrerequisiteNodeId(), np.getDependentNodeId()))
            .collect(Collectors.toList());
        return new TreePreview(mp.getTitle(), nodes, edges);
    }

    public static class TreePreview {
        public final String pathName;
        public final List<Node> nodes;
        public final List<PathService.EdgeData> edges;

        public TreePreview(String pathName, List<Node> nodes, List<PathService.EdgeData> edges) {
            this.pathName = pathName;
            this.nodes = nodes;
            this.edges = edges;
        }
    }

    /** Publish a path to the marketplace (frozen snapshot). */
    @Transactional
    public MarketplacePath publishPath(User author, Long pathId, String title, String description,
                                       String difficulty, Integer estimatedTimeMinutes, List<String> tags,
                                       Integer priceCents, boolean isPaid) {
        Path path = pathRepository.findById(pathId)
            .orElseThrow(() -> new IllegalArgumentException("Path not found: " + pathId));
        List<PathNode> pathNodes = pathNodeRepository.findByPathIdOrderBySequenceOrder(pathId);
        if (pathNodes.isEmpty()) {
            throw new IllegalArgumentException("Path has no nodes");
        }

        MarketplacePath mp = new MarketplacePath();
        mp.setAuthor(author);
        mp.setTitle(title != null && !title.isBlank() ? title : path.getName());
        mp.setDescription(description);
        mp.setDifficulty(difficulty != null && !difficulty.isBlank() ? difficulty : "intermediate");
        mp.setEstimatedTimeMinutes(estimatedTimeMinutes);
        mp.setTags(tags != null && !tags.isEmpty() ? String.join(",", tags) : null);
        mp.setPriceCents(priceCents != null ? priceCents : 0);
        mp.setPaid(isPaid && priceCents != null && priceCents > 0);
        mp = marketplacePathRepository.save(mp);

        int order = 0;
        for (PathNode pn : pathNodes) {
            MarketplacePathNode mpn = new MarketplacePathNode(mp.getId(), pn.getNodeId(), order++);
            marketplacePathNodeRepository.save(mpn);
        }
        return mp;
    }

    /** List published paths with optional filters and sort. */
    @Transactional(readOnly = true)
    public List<MarketplacePath> listPaths(String tag, String difficulty, String sort, int limit) {
        PageRequest page = PageRequest.of(0, Math.min(limit, 50));
        String tagParam = (tag != null && !tag.isBlank()) ? tag : null;
        String diffParam = (difficulty != null && !difficulty.isBlank()) ? difficulty : null;

        if (tagParam != null || diffParam != null) {
            return "imports".equalsIgnoreCase(sort)
                ? marketplacePathRepository.findByFiltersOrderByImports(tagParam, diffParam, page)
                : marketplacePathRepository.findByFiltersOrderByNewest(tagParam, diffParam, page);
        }
        return "imports".equalsIgnoreCase(sort)
            ? marketplacePathRepository.findAllOrderByImportCountDesc(page)
            : marketplacePathRepository.findAllOrderByCreatedAtDesc(page);
    }

    /** Get one published path for preview. */
    @Transactional(readOnly = true)
    public Optional<MarketplacePath> getById(Long id) {
        return marketplacePathRepository.findById(id);
    }

    /** Check if user has purchased a paid path. */
    @Transactional(readOnly = true)
    public boolean hasPurchased(User user, Long marketplacePathId) {
        if (user == null) return false;
        return marketplacePurchaseRepository.existsByUser_IdAndMarketplacePath_Id(user.getId(), marketplacePathId);
    }

    /** Purchase a paid marketplace path. */
    @Transactional
    public MarketplacePurchase purchasePath(User user, Long marketplacePathId) {
        MarketplacePath mp = marketplacePathRepository.findById(marketplacePathId)
            .orElseThrow(() -> new IllegalArgumentException("Published path not found: " + marketplacePathId));
        if (!mp.isPaid() || mp.getPriceCents() == null || mp.getPriceCents() <= 0) {
            throw new IllegalArgumentException("Path is not for sale");
        }
        if (mp.getAuthor() != null && mp.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are the author; you already own this path");
        }
        if (marketplacePurchaseRepository.existsByUser_IdAndMarketplacePath_Id(user.getId(), marketplacePathId)) {
            throw new IllegalArgumentException("You already own this path");
        }
        // Reload buyer and author with latest balances
        User buyer = userRepository.findById(user.getId())
            .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));
        int price = mp.getPriceCents();
        int buyerBalance = buyer.getBalanceCents() != null ? buyer.getBalanceCents() : 0;
        if (buyerBalance < price) {
            throw new IllegalArgumentException("Not enough balance to purchase this path");
        }
        buyer.setBalanceCents(buyerBalance - price);
        userRepository.save(buyer);

        User author = mp.getAuthor();
        if (author != null && !author.getId().equals(buyer.getId())) {
            User authorEntity = userRepository.findById(author.getId())
                .orElse(author);
            int authorBalance = authorEntity.getBalanceCents() != null ? authorEntity.getBalanceCents() : 0;
            authorEntity.setBalanceCents(authorBalance + price);
            userRepository.save(authorEntity);
        }

        MarketplacePurchase purchase = new MarketplacePurchase(user, mp, price);
        return marketplacePurchaseRepository.save(purchase);
    }

    /** Import a published path: create new local path (copy-on-import). Requires purchase if paid. */
    @Transactional
    public Path importPath(User user, Long marketplacePathId) {
        MarketplacePath mp = marketplacePathRepository.findById(marketplacePathId)
            .orElseThrow(() -> new IllegalArgumentException("Published path not found: " + marketplacePathId));
        boolean isAuthor = mp.getAuthor() != null && mp.getAuthor().getId().equals(user.getId());
        if (mp.isPaid()
            && !isAuthor
            && !marketplacePurchaseRepository.existsByUser_IdAndMarketplacePath_Id(user.getId(), marketplacePathId)) {
            throw new IllegalArgumentException("You must purchase this path before importing");
        }
        List<MarketplacePathNode> nodes = marketplacePathNodeRepository.findByMarketplacePathIdOrderBySequenceOrder(marketplacePathId);
        if (nodes.isEmpty()) {
            throw new IllegalArgumentException("Published path has no nodes");
        }

        String baseName = "Copy of " + mp.getTitle();
        String pathName = baseName;
        int suffix = 1;
        while (pathRepository.findByOwner_IdAndName(user.getId(), pathName).isPresent()) {
            pathName = baseName + " (" + (++suffix) + ")";
        }

        Path newPath = new Path(user, pathName, mp.getDescription());
        newPath = pathRepository.save(newPath);

        int order = 0;
        for (MarketplacePathNode mpn : nodes) {
            pathNodeRepository.save(new PathNode(newPath.getId(), mpn.getNodeId(), order++));
        }

        mp.setImportCount(mp.getImportCount() + 1);
        marketplacePathRepository.save(mp);

        return newPath;
    }

    /** Generate and publish an AI-created course to the marketplace. */
    @Transactional
    public MarketplacePath generateAndPublishAICourse(User author, String topic, String description,
                                                       String difficulty, Integer estimatedTimeMinutes,
                                                       List<String> tags, Integer priceCents, boolean isPaid) {
        // Use AI to generate course structure
        List<PathNodeSuggestion> suggestions = aiService.generatePath(
            description != null && !description.isBlank() ? description : topic,
            difficulty != null ? difficulty : "intermediate",
            estimatedTimeMinutes != null ? estimatedTimeMinutes : 600
        );

        if (suggestions.isEmpty()) {
            throw new IllegalArgumentException("AI failed to generate course structure");
        }

        // Create or find categories and nodes
        Path tempPath = new Path(author, "Temp AI Path", description);
        tempPath = pathRepository.save(tempPath);

        int order = 0;
        for (PathNodeSuggestion suggestion : suggestions) {
            // Find or create category
            Category category = categoryRepository.findByName(suggestion.getCategory())
                .orElseGet(() -> categoryRepository.save(new Category(suggestion.getCategory(), 0.03)));

            // Create node if it doesn't exist (by name match in category)
            Node node = nodeRepository.findByCategory_IdAndName(category.getId(), suggestion.getName())
                .orElseGet(() -> {
                    Node newNode = new Node(category, suggestion.getName(), 
                        suggestion.getDescription() != null ? suggestion.getDescription() : "", 
                        null, null);
                    return nodeRepository.save(newNode);
                });

            pathNodeRepository.save(new PathNode(tempPath.getId(), node.getId(), order++));
        }

        // Generate title and description if not provided
        String title = topic != null && !topic.isBlank() ? topic : "AI Generated Course";
        String finalDescription = description != null && !description.isBlank() 
            ? description 
            : "An AI-generated learning path covering: " + String.join(", ", 
                suggestions.stream().map(PathNodeSuggestion::getName).limit(5).toList());

        // Publish to marketplace
        MarketplacePath mp = publishPath(author, tempPath.getId(), title, finalDescription,
            difficulty != null ? difficulty : "intermediate", estimatedTimeMinutes, tags, priceCents, isPaid);

        // Clean up temp path (marketplace path is a frozen snapshot)
        pathNodeRepository.deleteAll(pathNodeRepository.findByPathIdOrderBySequenceOrder(tempPath.getId()));
        pathRepository.delete(tempPath);

        return mp;
    }
}
