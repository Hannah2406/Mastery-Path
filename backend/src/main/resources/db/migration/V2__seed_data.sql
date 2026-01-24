-- Seed Data: Categories, Paths, Nodes, Prerequisites

-- Categories for Blind 75
INSERT INTO category (id, name, decay_constant) VALUES
(1, 'Array', 0.03),
(2, 'Two Pointers', 0.03),
(3, 'Sliding Window', 0.03),
(4, 'Stack', 0.03),
(5, 'Binary Search', 0.03),
(6, 'Linked List', 0.03),
(7, 'Trees', 0.03),
(8, 'Tries', 0.04),
(9, 'Heap', 0.03),
(10, 'Backtracking', 0.04),
(11, 'Graphs', 0.04),
(12, 'Dynamic Programming', 0.05);

-- Categories for AMC8
INSERT INTO category (id, name, decay_constant) VALUES
(13, 'Algebra', 0.02),
(14, 'Geometry', 0.02),
(15, 'Counting & Probability', 0.03),
(16, 'Number Theory', 0.02);

-- Paths
INSERT INTO path (id, name, description) VALUES
(1, 'Blind 75', 'Master essential coding interview patterns with 75 curated problems'),
(2, 'AMC8', 'Competition math fundamentals for middle school students');

-- Blind 75 Nodes (subset for MVP)
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Array
(1, 1, 'Two Sum', 'Find two numbers that add up to target', 'lc-1', 'https://leetcode.com/problems/two-sum/'),
(2, 1, 'Best Time to Buy and Sell Stock', 'Find maximum profit from stock prices', 'lc-121', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'),
(3, 1, 'Contains Duplicate', 'Check if array contains duplicates', 'lc-217', 'https://leetcode.com/problems/contains-duplicate/'),
(4, 1, 'Product of Array Except Self', 'Calculate product without division', 'lc-238', 'https://leetcode.com/problems/product-of-array-except-self/'),
(5, 1, 'Maximum Subarray', 'Find contiguous subarray with largest sum', 'lc-53', 'https://leetcode.com/problems/maximum-subarray/'),
-- Two Pointers
(6, 2, '3Sum', 'Find all triplets that sum to zero', 'lc-15', 'https://leetcode.com/problems/3sum/'),
(7, 2, 'Container With Most Water', 'Find container with maximum water', 'lc-11', 'https://leetcode.com/problems/container-with-most-water/'),
-- Sliding Window
(8, 3, 'Longest Substring Without Repeating Characters', 'Find longest unique substring', 'lc-3', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'),
(9, 3, 'Minimum Window Substring', 'Find minimum window containing all chars', 'lc-76', 'https://leetcode.com/problems/minimum-window-substring/'),
-- Stack
(10, 4, 'Valid Parentheses', 'Check if brackets are balanced', 'lc-20', 'https://leetcode.com/problems/valid-parentheses/'),
-- Binary Search
(11, 5, 'Binary Search', 'Basic binary search implementation', 'lc-704', 'https://leetcode.com/problems/binary-search/'),
(12, 5, 'Search in Rotated Sorted Array', 'Binary search in rotated array', 'lc-33', 'https://leetcode.com/problems/search-in-rotated-sorted-array/'),
-- Linked List
(13, 6, 'Reverse Linked List', 'Reverse a singly linked list', 'lc-206', 'https://leetcode.com/problems/reverse-linked-list/'),
(14, 6, 'Merge Two Sorted Lists', 'Merge two sorted linked lists', 'lc-21', 'https://leetcode.com/problems/merge-two-sorted-lists/'),
(15, 6, 'Linked List Cycle', 'Detect cycle in linked list', 'lc-141', 'https://leetcode.com/problems/linked-list-cycle/'),
-- Trees
(16, 7, 'Invert Binary Tree', 'Mirror a binary tree', 'lc-226', 'https://leetcode.com/problems/invert-binary-tree/'),
(17, 7, 'Maximum Depth of Binary Tree', 'Find tree height', 'lc-104', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'),
(18, 7, 'Same Tree', 'Check if two trees are identical', 'lc-100', 'https://leetcode.com/problems/same-tree/'),
(19, 7, 'Binary Tree Level Order Traversal', 'BFS traversal of tree', 'lc-102', 'https://leetcode.com/problems/binary-tree-level-order-traversal/'),
(20, 7, 'Validate Binary Search Tree', 'Check if valid BST', 'lc-98', 'https://leetcode.com/problems/validate-binary-search-tree/'),
-- Graphs
(21, 11, 'Number of Islands', 'Count islands in 2D grid', 'lc-200', 'https://leetcode.com/problems/number-of-islands/'),
(22, 11, 'Clone Graph', 'Deep copy a graph', 'lc-133', 'https://leetcode.com/problems/clone-graph/'),
(23, 11, 'Course Schedule', 'Detect cycle in directed graph', 'lc-207', 'https://leetcode.com/problems/course-schedule/'),
-- Dynamic Programming
(24, 12, 'Climbing Stairs', 'Count ways to climb stairs', 'lc-70', 'https://leetcode.com/problems/climbing-stairs/'),
(25, 12, 'House Robber', 'Maximum money without adjacent houses', 'lc-198', 'https://leetcode.com/problems/house-robber/'),
(26, 12, 'Coin Change', 'Minimum coins for amount', 'lc-322', 'https://leetcode.com/problems/coin-change/'),
(27, 12, 'Longest Increasing Subsequence', 'Find LIS length', 'lc-300', 'https://leetcode.com/problems/longest-increasing-subsequence/');

-- AMC8 Nodes
INSERT INTO node (id, category_id, name, description, external_key, external_url) VALUES
-- Algebra
(101, 13, 'Basic Arithmetic', 'Addition, subtraction, multiplication, division', 'amc8-arith', NULL),
(102, 13, 'Order of Operations', 'PEMDAS and expression evaluation', 'amc8-pemdas', NULL),
(103, 13, 'Fractions & Decimals', 'Operations with fractions and decimals', 'amc8-frac', NULL),
(104, 13, 'Ratios & Proportions', 'Solving ratio and proportion problems', 'amc8-ratio', NULL),
(105, 13, 'Linear Equations', 'Solving one-variable equations', 'amc8-linear', NULL),
(106, 13, 'Word Problems', 'Translating words to equations', 'amc8-word', NULL),
-- Geometry
(107, 14, 'Basic Shapes', 'Properties of triangles, rectangles, circles', 'amc8-shapes', NULL),
(108, 14, 'Perimeter & Area', 'Calculating perimeter and area', 'amc8-area', NULL),
(109, 14, 'Angles', 'Angle relationships and measurements', 'amc8-angles', NULL),
(110, 14, 'Pythagorean Theorem', 'Right triangle relationships', 'amc8-pythag', NULL),
(111, 14, 'Circles', 'Circumference, area, arcs', 'amc8-circles', NULL),
-- Counting & Probability
(112, 15, 'Basic Counting', 'Counting principles', 'amc8-count', NULL),
(113, 15, 'Permutations', 'Arrangements where order matters', 'amc8-perm', NULL),
(114, 15, 'Combinations', 'Selections where order does not matter', 'amc8-comb', NULL),
(115, 15, 'Basic Probability', 'Probability fundamentals', 'amc8-prob', NULL),
-- Number Theory
(116, 16, 'Divisibility Rules', 'Testing divisibility', 'amc8-divis', NULL),
(117, 16, 'Factors & Multiples', 'Finding factors and multiples', 'amc8-factors', NULL),
(118, 16, 'Prime Numbers', 'Prime factorization', 'amc8-primes', NULL),
(119, 16, 'GCD & LCM', 'Greatest common divisor and least common multiple', 'amc8-gcdlcm', NULL);

-- Blind 75 Prerequisites (DAG edges)
INSERT INTO node_prerequisite (prerequisite_node_id, dependent_node_id) VALUES
-- Array foundations
(1, 3),   -- Two Sum -> Contains Duplicate
(1, 2),   -- Two Sum -> Best Time to Buy
(3, 4),   -- Contains Duplicate -> Product of Array
(2, 5),   -- Best Time -> Maximum Subarray
-- Two Pointers builds on Array
(1, 6),   -- Two Sum -> 3Sum
(1, 7),   -- Two Sum -> Container With Most Water
-- Sliding Window
(1, 8),   -- Two Sum -> Longest Substring
(8, 9),   -- Longest Substring -> Min Window
-- Stack
(1, 10),  -- Two Sum -> Valid Parentheses
-- Binary Search
(1, 11),  -- Two Sum -> Binary Search
(11, 12), -- Binary Search -> Search Rotated
-- Linked List
(1, 13),  -- Two Sum -> Reverse Linked List
(13, 14), -- Reverse -> Merge Two Lists
(13, 15), -- Reverse -> Linked List Cycle
-- Trees build on Linked List
(13, 16), -- Reverse LL -> Invert Tree
(16, 17), -- Invert -> Max Depth
(17, 18), -- Max Depth -> Same Tree
(17, 19), -- Max Depth -> Level Order
(17, 20), -- Max Depth -> Validate BST
-- Graphs build on Trees
(19, 21), -- Level Order -> Number of Islands
(21, 22), -- Islands -> Clone Graph
(22, 23), -- Clone -> Course Schedule
-- DP
(5, 24),  -- Maximum Subarray -> Climbing Stairs
(24, 25), -- Climbing Stairs -> House Robber
(25, 26), -- House Robber -> Coin Change
(26, 27); -- Coin Change -> LIS

-- AMC8 Prerequisites
INSERT INTO node_prerequisite (prerequisite_node_id, dependent_node_id) VALUES
-- Algebra chain
(101, 102), -- Arithmetic -> Order of Operations
(102, 103), -- PEMDAS -> Fractions
(103, 104), -- Fractions -> Ratios
(104, 105), -- Ratios -> Linear Equations
(105, 106), -- Linear -> Word Problems
-- Geometry chain
(101, 107), -- Arithmetic -> Basic Shapes
(107, 108), -- Shapes -> Area/Perimeter
(107, 109), -- Shapes -> Angles
(108, 110), -- Area -> Pythagorean
(109, 110), -- Angles -> Pythagorean
(110, 111), -- Pythagorean -> Circles
-- Counting chain
(101, 112), -- Arithmetic -> Basic Counting
(112, 113), -- Counting -> Permutations
(112, 114), -- Counting -> Combinations
(113, 115), -- Permutations -> Probability
(114, 115), -- Combinations -> Probability
-- Number Theory chain
(101, 116), -- Arithmetic -> Divisibility
(116, 117), -- Divisibility -> Factors
(117, 118), -- Factors -> Primes
(118, 119); -- Primes -> GCD/LCM

-- Path-Node mappings for Blind 75
INSERT INTO path_node (path_id, node_id, sequence_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5),
(1, 6, 6), (1, 7, 7), (1, 8, 8), (1, 9, 9), (1, 10, 10),
(1, 11, 11), (1, 12, 12), (1, 13, 13), (1, 14, 14), (1, 15, 15),
(1, 16, 16), (1, 17, 17), (1, 18, 18), (1, 19, 19), (1, 20, 20),
(1, 21, 21), (1, 22, 22), (1, 23, 23), (1, 24, 24), (1, 25, 25),
(1, 26, 26), (1, 27, 27);

-- Path-Node mappings for AMC8
INSERT INTO path_node (path_id, node_id, sequence_order) VALUES
(2, 101, 1), (2, 102, 2), (2, 103, 3), (2, 104, 4), (2, 105, 5), (2, 106, 6),
(2, 107, 7), (2, 108, 8), (2, 109, 9), (2, 110, 10), (2, 111, 11),
(2, 112, 12), (2, 113, 13), (2, 114, 14), (2, 115, 15),
(2, 116, 16), (2, 117, 17), (2, 118, 18), (2, 119, 19);

-- Reset sequences
SELECT setval('category_id_seq', 20);
SELECT setval('path_id_seq', 10);
SELECT setval('node_id_seq', 200);
