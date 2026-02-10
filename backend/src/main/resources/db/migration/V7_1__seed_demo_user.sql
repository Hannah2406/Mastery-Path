-- Seed a demo user so marketplace paths (V8) have an author.
-- Password is "demo" (bcrypt). Safe to run: only inserts if no users exist.
INSERT INTO users (email, password_hash, created_at)
SELECT 'demo@masterypath.app', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);
