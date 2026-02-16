package com.masterypath.api.marketplace;

import com.masterypath.api.marketplace.dto.ImportPathResponse;
import com.masterypath.api.marketplace.dto.MarketplacePathResponse;
import com.masterypath.api.marketplace.dto.PublishPathRequest;
import com.masterypath.api.paths.dto.EdgeResponse;
import com.masterypath.api.paths.dto.NodeResponse;
import com.masterypath.api.paths.dto.TreeResponse;
import com.masterypath.domain.model.MarketplacePath;
import com.masterypath.domain.model.User;
import com.masterypath.domain.repo.MarketplacePathNodeRepository;
import com.masterypath.domain.service.AuthService;
import com.masterypath.domain.service.MarketplaceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {
    private static final String USER_ID_SESSION_KEY = "userId";

    private final MarketplaceService marketplaceService;
    private final MarketplacePathNodeRepository marketplacePathNodeRepository;
    private final AuthService authService;

    public MarketplaceController(MarketplaceService marketplaceService,
                                 MarketplacePathNodeRepository marketplacePathNodeRepository,
                                 AuthService authService) {
        this.marketplaceService = marketplaceService;
        this.marketplacePathNodeRepository = marketplacePathNodeRepository;
        this.authService = authService;
    }

    @PostMapping("/publish")
    public ResponseEntity<?> publish(@Valid @RequestBody PublishPathRequest request,
                                     HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        try {
            MarketplacePath mp = marketplaceService.publishPath(
                user,
                request.getPathId(),
                request.getTitle(),
                request.getDescription(),
                request.getDifficulty(),
                request.getEstimatedTimeMinutes(),
                request.getTags(),
                request.getPriceCents(),
                request.getIsPaid() != null && request.getIsPaid()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(mp, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paths")
    public ResponseEntity<?> listPaths(
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "20") int limit,
            HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        List<MarketplacePath> list = marketplaceService.listPaths(tag, difficulty, sort, limit);
        List<MarketplacePathResponse> response = list.stream()
            .map(mp -> toResponse(mp, user))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/paths/{id}")
    public ResponseEntity<?> getPath(@PathVariable Long id, HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        return marketplaceService.getById(id)
            .map(mp -> ResponseEntity.ok(toResponse(mp, user)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/paths/{id}/purchase")
    public ResponseEntity<?> purchasePath(@PathVariable Long id, HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        try {
            var purchase = marketplaceService.purchasePath(user, id);
            return ResponseEntity.ok(Map.of("success", true, "purchaseId", purchase.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/paths/{id}/import")
    public ResponseEntity<?> importPath(@PathVariable Long id, HttpServletRequest httpRequest) {
        User user = getCurrentUser(httpRequest);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated"));
        }
        try {
            var path = marketplaceService.importPath(user, id);
            return ResponseEntity.ok(new ImportPathResponse(path.getId(), path.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paths/{id}/tree")
    public ResponseEntity<?> getTreePreview(@PathVariable Long id, HttpServletRequest httpRequest) {
        try {
            MarketplaceService.TreePreview preview = marketplaceService.getTreePreview(id);
            List<NodeResponse> nodeResponses = preview.nodes.stream()
                .map(node -> NodeResponse.from(node, null))
                .collect(Collectors.toList());
            List<EdgeResponse> edgeResponses = preview.edges.stream()
                .map(e -> new EdgeResponse(e.source, e.target))
                .collect(Collectors.toList());
            TreeResponse response = new TreeResponse(id, preview.pathName, nodeResponses, edgeResponses);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private MarketplacePathResponse toResponse(MarketplacePath mp, User currentUser) {
        MarketplacePathResponse r = new MarketplacePathResponse();
        r.setId(mp.getId());
        r.setTitle(mp.getTitle());
        r.setDescription(mp.getDescription());
        r.setDifficulty(mp.getDifficulty());
        r.setEstimatedTimeMinutes(mp.getEstimatedTimeMinutes());
        r.setTags(mp.getTags());
        r.setImportCount(mp.getImportCount());
        r.setCreatedAt(mp.getCreatedAt());
        r.setPriceCents(mp.getPriceCents());
        r.setPaid(mp.isPaid());
        r.setCurrency(mp.getCurrency());
        if (mp.getAuthor() != null) {
            r.setAuthorEmail(mp.getAuthor().getEmail());
        }
        var nodeIds = marketplacePathNodeRepository.findNodeIdsByMarketplacePathId(mp.getId());
        r.setNodeCount(nodeIds.size());
        r.setNodeIds(nodeIds);
        if (currentUser != null && mp.isPaid()) {
            boolean isAuthor = mp.getAuthor() != null && mp.getAuthor().getId().equals(currentUser.getId());
            boolean hasPurchased = isAuthor || marketplaceService.hasPurchased(currentUser, mp.getId());
            r.setHasPurchased(hasPurchased);
        }
        return r;
    }

    private User getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Long userId = (Long) session.getAttribute(USER_ID_SESSION_KEY);
        if (userId == null) return null;
        return authService.findById(userId).orElse(null);
    }
}
