-- Marketplace: published paths (frozen snapshots) for browse and import
CREATE TABLE marketplace_path (
    id BIGSERIAL PRIMARY KEY,
    author_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
    estimated_time_minutes INT,
    tags VARCHAR(512),
    import_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_marketplace_path_author ON marketplace_path(author_user_id);
CREATE INDEX idx_marketplace_path_created ON marketplace_path(created_at DESC);
CREATE INDEX idx_marketplace_path_imports ON marketplace_path(import_count DESC);

-- Frozen structure: which nodes are in this published path (order preserved)
CREATE TABLE marketplace_path_node (
    marketplace_path_id BIGINT NOT NULL REFERENCES marketplace_path(id) ON DELETE CASCADE,
    node_id BIGINT NOT NULL REFERENCES node(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (marketplace_path_id, node_id)
);
CREATE INDEX idx_marketplace_path_node_path ON marketplace_path_node(marketplace_path_id);
