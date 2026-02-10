-- MasteryPath sample queries (run with: ./scripts/run-sql.sh)

\echo '=== Tables ==='
\dt

\echo ''
\echo '=== Marketplace paths ==='
SELECT id, title, difficulty, import_count, price_cents, is_paid, created_at
FROM marketplace_path
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '=== Users (id, email) ==='
SELECT id, email, created_at FROM users ORDER BY id LIMIT 10;

\echo ''
\echo '=== Learning paths (path table) ==='
SELECT id, name, description FROM path ORDER BY id;

\echo ''
\echo '=== Purchases (if any) ==='
SELECT p.id, mp.title, u.email AS buyer, p.price_cents, p.purchased_at
FROM marketplace_purchase p
JOIN marketplace_path mp ON mp.id = p.marketplace_path_id
JOIN users u ON u.id = p.user_id
ORDER BY p.purchased_at DESC
LIMIT 10;
