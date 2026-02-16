-- Make paths per-user: each account has their own paths
-- Add user_id to path table
ALTER TABLE path ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_path_user ON path(user_id);

-- For existing paths without owner, assign them to the first user (or demo user if exists)
-- This handles seed data migration
UPDATE path
SET user_id = (SELECT id FROM users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after assigning existing paths
ALTER TABLE path ALTER COLUMN user_id SET NOT NULL;

-- Remove unique constraint on name since users can have paths with same name
ALTER TABLE path DROP CONSTRAINT IF EXISTS path_name_key;

-- Add unique constraint on (user_id, name) so each user can have unique path names
CREATE UNIQUE INDEX idx_path_user_name ON path(user_id, name);
