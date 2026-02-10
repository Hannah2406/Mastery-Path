-- Seed demo marketplace paths (for demo/showcase)
-- These are published versions of existing paths with pricing

-- Note: This assumes users and paths exist from V2 seed data
-- We'll create marketplace paths referencing existing nodes

-- Free paths (Blind 75 variations)
INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Blind 75 - Complete Interview Prep',
    'Master all essential coding interview patterns with 75 curated problems. Perfect for FAANG prep.',
    'intermediate',
    1200,
    'DSA,interview,leetcode,FAANG',
    42,
    0,
    false,
    'USD',
    NOW() - INTERVAL '5 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

-- Paid premium paths
INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'System Design Mastery Path',
    'Complete system design interview prep: scalability, distributed systems, databases, caching, load balancing.',
    'advanced',
    1800,
    'system-design,interview,backend,distributed',
    18,
    2999,
    true,
    'USD',
    NOW() - INTERVAL '3 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Advanced Algorithms & Data Structures',
    'Deep dive into advanced algorithms: dynamic programming, graph algorithms, greedy, backtracking.',
    'advanced',
    1500,
    'algorithms,DSA,advanced,competitive-programming',
    25,
    1999,
    true,
    'USD',
    NOW() - INTERVAL '7 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Frontend Interview Prep - React & JavaScript',
    'Master frontend interviews: React hooks, state management, performance optimization, testing.',
    'intermediate',
    900,
    'frontend,react,javascript,interview',
    31,
    1499,
    true,
    'USD',
    NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Machine Learning Fundamentals',
    'Learn ML from scratch: linear regression, neural networks, deep learning, NLP basics.',
    'intermediate',
    2000,
    'machine-learning,AI,data-science,python',
    12,
    3999,
    true,
    'USD',
    NOW() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

-- Free beginner paths
INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Python Basics for Beginners',
    'Learn Python fundamentals: variables, loops, functions, OOP, file handling.',
    'beginner',
    600,
    'python,beginner,programming,basics',
    67,
    0,
    false,
    'USD',
    NOW() - INTERVAL '10 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'JavaScript Fundamentals',
    'Master JavaScript: ES6+, async/await, closures, prototypes, DOM manipulation.',
    'beginner',
    800,
    'javascript,beginner,web-development,ES6',
    54,
    0,
    false,
    'USD',
    NOW() - INTERVAL '8 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

-- More mock paths already on the market (paid only)
INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Data Structures & Algorithms Pro',
    'Full DSA curriculum: arrays, trees, graphs, DP, with 50+ problems and solutions.',
    'advanced',
    2400,
    'DSA,algorithms,interview,coding',
    38,
    2499,
    true,
    'USD',
    NOW() - INTERVAL '4 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

INSERT INTO marketplace_path (author_user_id, title, description, difficulty, estimated_time_minutes, tags, import_count, price_cents, is_paid, currency, created_at)
SELECT 
    (SELECT id FROM users LIMIT 1),
    'Backend Engineering with Node & SQL',
    'APIs, databases, auth, deployment. Build production-ready backends.',
    'intermediate',
    1600,
    'backend,node,sql,API',
    22,
    1999,
    true,
    'USD',
    NOW() - INTERVAL '6 days'
WHERE EXISTS (SELECT 1 FROM path WHERE name = 'Blind 75');

-- Now add nodes to marketplace paths (using Blind 75 nodes for demo)
-- Use WHERE NOT EXISTS so this works on both H2 and PostgreSQL (no ON CONFLICT).

-- Free Blind 75 path gets all Blind 75 nodes
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Blind 75 - Complete Interview Prep' AND p.name = 'Blind 75'
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- System Design path (use some Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'System Design Mastery Path' AND p.name = 'Blind 75' AND pn.sequence_order <= 10
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- Advanced Algorithms (use Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Advanced Algorithms & Data Structures' AND p.name = 'Blind 75' AND pn.sequence_order <= 15
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- Frontend path (use Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Frontend Interview Prep - React & JavaScript' AND p.name = 'Blind 75' AND pn.sequence_order <= 8
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- ML path (use Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Machine Learning Fundamentals' AND p.name = 'Blind 75' AND pn.sequence_order <= 12
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- Python Basics (use Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Python Basics for Beginners' AND p.name = 'Blind 75' AND pn.sequence_order <= 5
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

-- JavaScript Fundamentals (use Blind 75 nodes as placeholder)
INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'JavaScript Fundamentals' AND p.name = 'Blind 75' AND pn.sequence_order <= 6
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Data Structures & Algorithms Pro' AND p.name = 'Blind 75' AND pn.sequence_order <= 20
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);

INSERT INTO marketplace_path_node (marketplace_path_id, node_id, sequence_order)
SELECT mp.id, pn.node_id, pn.sequence_order
FROM marketplace_path mp
CROSS JOIN path_node pn
JOIN path p ON pn.path_id = p.id
WHERE mp.title = 'Backend Engineering with Node & SQL' AND p.name = 'Blind 75' AND pn.sequence_order <= 12
AND NOT EXISTS (SELECT 1 FROM marketplace_path_node mpn WHERE mpn.marketplace_path_id = mp.id AND mpn.node_id = pn.node_id);
