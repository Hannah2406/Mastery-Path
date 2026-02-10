# MasteryPath Database Guide

The app uses **PostgreSQL** when you run with Docker. All marketplace data and app data are stored there. This doc shows how to find the database, start it, connect to it, and what tables exist.

---

## Where is the database?

| What | Where |
|------|--------|
| **Type** | PostgreSQL (in a Docker container) |
| **Container name** | `masterypath-db` |
| **Defined in** | `docker-compose.yml` (project root) |
| **Data stored** | Docker volume `postgres_data` (persists on your machine) |
| **Schema / migrations** | `backend/src/main/resources/db/migration/` (V1, V2, … V8) |

**Connection (from your Mac):**

- **Host:** `localhost`
- **Port:** `5433` (mapped from container port 5432)
- **Database:** `masterypath`
- **User:** `masterypath`
- **Password:** `masterypath`

**Quick check if it’s running:**

```bash
docker ps --filter name=masterypath-db
```

If you see `masterypath-db` with status **Up**, the database is running. If not, start it:

```bash
docker compose up -d
# or: docker start masterypath-db
```

---

## 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts PostgreSQL in a container. Data is stored in a Docker volume (`postgres_data`) so it persists after you stop the container.

To stop and remove the volume (full reset):

```bash
docker compose down -v
```

---

## 2. How to access the database

### Connection details

| Setting   | Value        |
|----------|--------------|
| **Host** | `localhost`  |
| **Port** | `5433`       |
| **Database** | `masterypath` |
| **User** | `masterypath` |
| **Password** | `masterypath` |

**Connection URL (JDBC):**  
`jdbc:postgresql://localhost:5433/masterypath`

**Connection URL (for apps):**  
`postgresql://masterypath:masterypath@localhost:5433/masterypath`

---

### Option A: Command line (psql)

If you have PostgreSQL client tools installed:

```bash
# From project root
PGPASSWORD=masterypath psql -h localhost -p 5433 -U masterypath -d masterypath
```

Or use the project script (if you created it):

```bash
./scripts/connect-db.sh
```

Then you can run SQL, for example:

```sql
\dt                    -- list all tables
\d marketplace_path   -- describe marketplace_path table
SELECT * FROM marketplace_path;
\q                     -- quit
```

---

### Option B: GUI tools

Use any PostgreSQL client with the settings above.

**TablePlus / DBeaver / pgAdmin / DataGrip:**

1. New connection → PostgreSQL.
2. Host: `localhost`, Port: `5433`.
3. Database: `masterypath`, User: `masterypath`, Password: `masterypath`.
4. Connect, then browse tables and run SQL.

---

## 3. Tables and what they store

### Core tables (V1)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password_hash, created_at). |
| `category` | Skill categories and decay_constant. |
| `node` | Global skill pool (name, description, external_url, category_id). |
| `node_prerequisite` | Prerequisite edges between nodes (DAG). |
| `path` | Learning paths (name, description). |
| `path_node` | Which nodes are in each path and in what order (path_id, node_id, sequence_order). |
| `user_skill` | Per-user mastery state (user_id, node_id, mastery_score, node_status, last_practiced_at, last_successful_at). |
| `performance_log` | Practice attempts (user_id, node_id, occurred_at, is_success, error_code, duration_ms). |
| `maintenance_task` | Decay/maintenance nudges (user_skill_id, completed_at). |

### Marketplace tables

| Table | Purpose |
|-------|---------|
| **marketplace_path** | Published paths on the marketplace. One row per listing. |
| **marketplace_path_node** | Frozen list of nodes for each published path (which nodes and order). |
| **marketplace_purchase** | Who bought which paid path (user_id, marketplace_path_id, price_cents, purchased_at). |

### Marketplace table details

**marketplace_path**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key. |
| author_user_id | BIGINT | FK → users(id). Who published it. |
| title | VARCHAR(255) | Listing title. |
| description | TEXT | Listing description. |
| difficulty | VARCHAR(20) | beginner / intermediate / advanced. |
| estimated_time_minutes | INT | Estimated duration. |
| tags | VARCHAR(512) | Comma-separated tags. |
| import_count | INT | Number of times imported. |
| price_cents | INT | Price in cents (0 = free). |
| is_paid | BOOLEAN | Whether path is paid. |
| currency | VARCHAR(3) | e.g. USD. |
| created_at | TIMESTAMP | When published. |

**marketplace_path_node**

| Column | Type | Description |
|--------|------|-------------|
| marketplace_path_id | BIGINT | FK → marketplace_path(id). |
| node_id | BIGINT | FK → node(id). |
| sequence_order | INT | Order of the node in the path. |
| (PK) | (marketplace_path_id, node_id) | Composite primary key. |

**marketplace_purchase**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key. |
| user_id | BIGINT | FK → users(id). Buyer. |
| marketplace_path_id | BIGINT | FK → marketplace_path(id). Path bought. |
| price_cents | INT | Price paid. |
| purchased_at | TIMESTAMP | When purchased. |
| UNIQUE | (user_id, marketplace_path_id) | One purchase per user per path. |

---

## 4. Example queries

**List all marketplace paths (with author email):**

```sql
SELECT mp.id, mp.title, mp.difficulty, mp.import_count, mp.price_cents, mp.is_paid, mp.created_at, u.email AS author_email
FROM marketplace_path mp
JOIN users u ON u.id = mp.author_user_id
ORDER BY mp.created_at DESC;
```

**Count paths by free vs paid:**

```sql
SELECT is_paid, COUNT(*) FROM marketplace_path GROUP BY is_paid;
```

**List purchases (who bought what):**

```sql
SELECT mp.id, mp.title, u.email AS buyer, p.price_cents, p.purchased_at
FROM marketplace_purchase p
JOIN marketplace_path mp ON mp.id = p.marketplace_path_id
JOIN users u ON u.id = p.user_id
ORDER BY p.purchased_at DESC;
```

**Nodes in a specific marketplace path (e.g. id = 1):**

```sql
SELECT mpn.sequence_order, n.name, n.description
FROM marketplace_path_node mpn
JOIN node n ON n.id = mpn.node_id
WHERE mpn.marketplace_path_id = 1
ORDER BY mpn.sequence_order;
```

**All users:**

```sql
SELECT id, email, created_at FROM users ORDER BY id;
```

**All learning paths (your paths, not marketplace):**

```sql
SELECT id, name, description FROM path ORDER BY id;
```

---

## 5. Migrations (schema and seed data)

Schema and seed data are applied by **Flyway** when the backend starts:

- **V1** – Core schema (users, path, node, path_node, user_skill, performance_log, etc.).
- **V2** – Seed data (categories, paths like Blind 75 / AMC8, nodes).
- **V3–V5** – AMC8 problems and related data.
- **V6** – Marketplace tables (marketplace_path, marketplace_path_node).
- **V7** – Marketplace pricing (price_cents, is_paid, marketplace_purchase).
- **V7_1** – Demo user (for marketplace authors).
- **V8** – Seed marketplace paths (mock free and paid paths).

So: start Docker, then start the backend; the database and marketplace data will be created/updated automatically.

---

## 6. Quick reference

| Task | Command / Action |
|------|------------------|
| Start DB | `docker compose up -d` |
| Stop DB | `docker compose down` |
| Reset DB (delete data) | `docker compose down -v` then `docker compose up -d` and restart backend |
| Connect (psql) | `PGPASSWORD=masterypath psql -h localhost -p 5433 -U masterypath -d masterypath` |
| List tables | `\dt` in psql |
| Describe table | `\d table_name` in psql |

Host: **localhost**, Port: **5433**, Database: **masterypath**, User: **masterypath**, Password: **masterypath**.
