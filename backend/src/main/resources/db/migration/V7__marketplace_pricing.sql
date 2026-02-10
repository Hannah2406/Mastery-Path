-- Add pricing and purchase tracking to marketplace
ALTER TABLE marketplace_path ADD COLUMN price_cents INT DEFAULT 0;
ALTER TABLE marketplace_path ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE marketplace_path ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Track purchases (who bought what)
CREATE TABLE marketplace_purchase (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace_path_id BIGINT NOT NULL REFERENCES marketplace_path(id) ON DELETE CASCADE,
    price_cents INT NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, marketplace_path_id)
);
CREATE INDEX idx_marketplace_purchase_user ON marketplace_purchase(user_id);
CREATE INDEX idx_marketplace_purchase_path ON marketplace_purchase(marketplace_path_id);
