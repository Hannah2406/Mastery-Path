# Marketplace Example Data

When the app runs with migrations (including V8 seed), the marketplace is populated with the paths below. You can use this as a reference for titles, prices, and descriptions.

---

## Free Paths (3)

| Title | Description | Difficulty | Est. time | Tags |
|-------|-------------|------------|-----------|------|
| **Blind 75 - Complete Interview Prep** | Master all essential coding interview patterns with 75 curated problems. Perfect for FAANG prep. | intermediate | 20h | DSA, interview, leetcode, FAANG |
| **Python Basics for Beginners** | Learn Python fundamentals: variables, loops, functions, OOP, file handling. | beginner | 10h | python, beginner, programming, basics |
| **JavaScript Fundamentals** | Master JavaScript: ES6+, async/await, closures, prototypes, DOM manipulation. | beginner | 13h | javascript, beginner, web-development, ES6 |

---

## Paid Paths (6) — must pay to import

| Title | Price | Description | Difficulty | Est. time | Tags |
|-------|--------|-------------|------------|-----------|------|
| **System Design Mastery Path** | **$29.99** | Complete system design interview prep: scalability, distributed systems, databases, caching, load balancing. | advanced | 30h | system-design, interview, backend, distributed |
| **Advanced Algorithms & Data Structures** | **$19.99** | Deep dive into advanced algorithms: dynamic programming, graph algorithms, greedy, backtracking. | advanced | 25h | algorithms, DSA, advanced, competitive-programming |
| **Frontend Interview Prep - React & JavaScript** | **$14.99** | Master frontend interviews: React hooks, state management, performance optimization, testing. | intermediate | 15h | frontend, react, javascript, interview |
| **Machine Learning Fundamentals** | **$39.99** | Learn ML from scratch: linear regression, neural networks, deep learning, NLP basics. | intermediate | 33h | machine-learning, AI, data-science, python |
| **Data Structures & Algorithms Pro** | **$24.99** | Full DSA curriculum: arrays, trees, graphs, DP, with 50+ problems and solutions. | advanced | 40h | DSA, algorithms, interview, coding |
| **Backend Engineering with Node & SQL** | **$19.99** | APIs, databases, auth, deployment. Build production-ready backends. | intermediate | 27h | backend, node, sql, API |

---

## Summary

- **9 paths total**: 3 free (Get Free), 6 paid (Checkout → pay → Import)
- **Prices**: Free or $14.99 – $39.99 (stored as `price_cents`: 0, 1499, 1999, 2999, 3999)
- **Demo import counts** are seeded (e.g. 42, 18, 25) so the marketplace looks active

These rows are created by Flyway migrations when the app starts:

- **V7.1** seeds a demo user (`demo@masterypath.app` / password: `password`) so marketplace paths have an author.
- **V8** inserts the 7 marketplace paths and links them to nodes from the "Blind 75" path (from V2 seed).

So after a fresh start (H2 or Postgres), the marketplace shows these 7 paths. You can also log in as `demo@masterypath.app` to test.
