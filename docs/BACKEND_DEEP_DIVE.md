# Backend Deep Dive — How MasteryPath Backend Works

This document gives you a complete overview and deep dive into how the MasteryPath backend works: architecture, request flow, key components, and how everything fits together.

---

# Part 1: High-Level Overview

## What the Backend Does

The MasteryPath backend is a **Spring Boot REST API** that:

1. **Manages users** — registration, login, session management
2. **Manages personalized paths** — each user has their own learning paths (Blind 75, AMC8, custom paths)
3. **Tracks mastery** — when you practice a node, it updates your mastery score and unlocks new nodes
4. **Provides marketplace** — users can publish paths and others can browse, purchase, and import them
5. **Handles purchases** — wallet system where buyers pay and authors get credited
6. **Stores everything** — all data persists in PostgreSQL (shared across all instances)

## Tech Stack

- **Framework**: Spring Boot 3.2 (Java 17)
- **Database**: PostgreSQL (default) with Flyway migrations
- **ORM**: JPA/Hibernate (Spring Data JPA)
- **Security**: Spring Security (session-based auth, BCrypt passwords)
- **API**: REST (JSON)
- **Sessions**: Stored in database (JDBC session store)

---

# Part 2: Architecture — The Layered Structure

The backend follows a **layered architecture**. Each layer has a clear responsibility, and data flows **one direction**: Controller → Service → Repository → Database.

```
  HTTP Request (e.g. POST /api/v1/logs)
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  API LAYER (api/)                                            │
  │  Controllers:                                                 │
  │  - Receive HTTP requests                                     │
  │  - Validate input (DTOs)                                     │
  │  - Get current user from session                             │
  │  - Call services                                             │
  │  - Convert results to response DTOs                          │
  │  - Return JSON + status code                                 │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  SERVICE LAYER (domain/service/)                            │
  │  Business logic:                                             │
  │  - Rules and calculations                                    │
  │  - Orchestration (calls multiple repositories/services)      │
  │  - Transactions (@Transactional)                            │
  │  - No HTTP, no SQL — pure Java logic                        │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  REPOSITORY LAYER (domain/repo/)                             │
  │  Data access:                                                │
  │  - Interfaces extending JpaRepository                        │
  │  - Spring Data JPA implements them                           │
  │  - Methods like findByUserId() become SQL                    │
  │  - Only place that talks to database                        │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  MODEL LAYER (domain/model/)                                │
  │  Entities:                                                   │
  │  - Java classes mapping to database tables                  │
  │  - @Entity, @Table, @Column annotations                     │
  │  - Relationships (@ManyToOne, @OneToMany)                   │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
  PostgreSQL Database
```

**Key principle**: Controllers don't contain business logic; Services don't write SQL; Repositories don't contain business rules.

---

# Part 3: Request Flow — Step-by-Step Example

Let's trace what happens when a user **logs a practice** (e.g. "Two Sum", success).

## Step 1: Frontend sends request

```javascript
// Frontend: api/logs.js
fetch('/api/v1/logs', {
  method: 'POST',
  credentials: 'include',  // Sends session cookie
  body: JSON.stringify({
    nodeId: 1,
    isSuccess: true,
    errorCode: null,
    durationMs: 5000
  })
})
```

- Browser sends POST to `http://localhost:5173/api/v1/logs`
- Vite proxy forwards to `http://localhost:8080/api/v1/logs`
- Cookie (`JSESSIONID=...`) is sent automatically

## Step 2: Spring Security & CORS

**SecurityConfig.java**:
- CORS allows `localhost:5173` origin
- CSRF is disabled (API-only)
- Session creation: `IF_REQUIRED` (creates session when needed)
- Most endpoints are `permitAll()` — controllers handle auth manually

So the request passes through security filters and reaches the controller.

## Step 3: Controller receives request

**LogController.java**:

```java
@PostMapping
public ResponseEntity<?> createLog(@Valid @RequestBody CreateLogRequest request,
                                   HttpServletRequest httpRequest) {
    User user = getCurrentUser(httpRequest);  // Gets userId from session
    if (user == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Not authenticated"));
    }
    // Validate: if fail, errorCode required
    if (!request.getIsSuccess() && request.getErrorCode() == null) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "errorCode required when isSuccess is false"));
    }
    // Call service
    ProcessLogResult result = masteryService.processLog(
        user, request.getNodeId(), request.getIsSuccess(),
        request.getErrorCode(), request.getDurationMs()
    );
    // Convert to response DTO
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(LogResponse.from(result));
}
```

**What happens**:
1. `@Valid` validates the request body (e.g. `nodeId` not null)
2. `getCurrentUser()` reads session, gets `userId`, loads `User` from DB
3. If no user → 401 Unauthorized
4. Validates business rule: "if fail, errorCode required"
5. Calls **one service method**: `masteryService.processLog(...)`
6. Converts service result to `LogResponse` DTO
7. Returns 201 Created + JSON

**Controller's job**: HTTP ↔ service call + DTOs. No business logic here.

## Step 4: Service processes the log

**MasteryService.java**:

```java
@Transactional
public ProcessLogResult processLog(User user, Long nodeId, boolean isSuccess,
                                   ErrorCode errorCode, Integer durationMs) {
    // 1. Load Node
    Node node = nodeRepository.findById(nodeId)
        .orElseThrow(() -> new IllegalArgumentException("Node not found"));
    
    // 2. Check if user can practice (prerequisites mastered?)
    if (!unlockEngine.canUserPractice(user, nodeId)) {
        throw new IllegalArgumentException("Node is locked. Complete prerequisites first.");
    }
    
    // 3. Find or create UserSkill
    UserSkill skill = userSkillRepository.findByUserIdAndNodeId(user.getId(), nodeId)
        .orElseGet(() -> {
            UserSkill newSkill = new UserSkill(user, node);
            return newSkill;  // Starts as LOCKED
        });
    
    // 4. Create PerformanceLog (immutable record)
    PerformanceLog log = createPerformanceLog(user, node, isSuccess, errorCode, durationMs, skill);
    
    // 5. Update mastery score
    applyDelta(skill, isSuccess, errorCode);
    // Success: +0.15, Execution error: -0.05, Forgot: -0.15, Concept: -0.25
    
    // 6. Update node status
    updateStatus(skill);
    // If score >= 0.8 → MASTERED
    // If first practice → LOCKED → AVAILABLE
    
    // 7. Save updated UserSkill
    userSkillRepository.save(skill);
    
    // 8. Check what nodes just unlocked
    List<Long> unlockedNodeIds = unlockEngine.checkUnlocks(user, node);
    
    // 9. Return result
    return new ProcessLogResult(log.getId(), skill, unlockedNodeIds);
}
```

**What happens**:
1. Loads `Node` from database
2. Checks prerequisites via `UnlockEngine` (all parents mastered?)
3. Finds or creates `UserSkill` (one row per user per node)
4. Creates `PerformanceLog` (append-only history)
5. Updates mastery: success +0.15, failures have penalties
6. Updates status: LOCKED → AVAILABLE → MASTERED (if score ≥ 0.8)
7. Saves `UserSkill`
8. Checks unlocks: "which child nodes can now be practiced?"
9. Returns result

**Service's job**: Business logic. Uses repositories and other services. No HTTP, no SQL.

## Step 5: Repository executes SQL

**UserSkillRepository.java**:

```java
@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    Optional<UserSkill> findByUserIdAndNodeId(Long userId, Long nodeId);
    // Spring Data JPA implements this automatically
}
```

When service calls `userSkillRepository.findByUserIdAndNodeId(userId, nodeId)`:
- Spring generates SQL: `SELECT * FROM user_skill WHERE user_id = ? AND node_id = ?`
- Executes query, maps result to `UserSkill` object
- Returns `Optional<UserSkill>`

When service calls `userSkillRepository.save(skill)`:
- If `skill.getId() == null` → `INSERT INTO user_skill ...`
- If `skill.getId() != null` → `UPDATE user_skill SET ... WHERE id = ?`

**Repository's job**: Data access only. No business logic.

## Step 6: Transaction commits

Because `processLog()` is `@Transactional`:
- All repository calls (find, save) happen in **one transaction**
- If anything throws an exception, **everything rolls back** (no partial updates)
- If successful, **everything commits** together

So mastery update, performance log creation, and unlock checks all succeed or fail together.

## Step 7: Response returns

Controller converts `ProcessLogResult` to `LogResponse` JSON:
```json
{
  "logId": 123,
  "masteryScore": 0.15,
  "nodeStatus": "AVAILABLE",
  "unlockedNodeIds": [3, 4, 5]
}
```

Frontend receives this and shows: "Practice logged! Mastery: 15%. Unlocked: 3 new nodes."

---

# Part 4: Authentication & Authorization

## How Sessions Work

**No JWT** — this app uses **server-side sessions** stored in the database.

### Registration Flow

1. User POSTs `/api/v1/auth/register` with email/password
2. **AuthService.register()**:
   - Checks if email exists
   - Hashes password with BCrypt
   - Saves `User` to database
   - **Calls `pathService.createStarterPaths(user)`** — creates "Blind 75" and "AMC8" paths for new user
3. **AuthController**:
   - Creates `HttpSession`
   - Stores `userId` in session: `session.setAttribute("userId", user.getId())`
   - Returns user JSON
4. Spring sends cookie: `JSESSIONID=ABC123...` (stored in browser)

### Login Flow

1. User POSTs `/api/v1/auth/login` with email/password
2. **AuthService.authenticate()**:
   - Finds user by email
   - Checks password with `passwordEncoder.matches(password, user.getPasswordHash())`
   - Returns `Optional<User>`
3. **AuthController**:
   - If authenticated: creates session, stores `userId`, returns user JSON
   - If not: returns 401 Unauthorized

### Subsequent Requests

1. Frontend sends cookie automatically (`credentials: 'include'`)
2. Controller calls `getCurrentUser(request)`:
   ```java
   HttpSession session = request.getSession(false);
   Long userId = (Long) session.getAttribute("userId");
   User user = authService.findById(userId).orElse(null);
   ```
3. If session exists and has `userId` → user is authenticated
4. If not → 401 Unauthorized

### Logout

1. POST `/api/v1/auth/logout`
2. Controller invalidates session: `session.invalidate()`
3. Cookie is cleared

## Session Storage

**application.yml**:
```yaml
spring:
  session:
    store-type: jdbc
```

Sessions are stored in database tables (`spring_session`, `spring_session_attributes`). This means:
- **Multiple backend instances** can share the same sessions (they all read from the same DB)
- Sessions survive backend restarts
- No sticky sessions needed in load balancers

## Authorization (Who Can Do What)

**Current approach**: Controllers check authentication manually.

- **Public endpoints**: `/api/v1/health`, `/api/v1/auth/**`
- **Protected endpoints**: All others require session with `userId`
- **Path ownership**: Users can only see/modify **their own** paths (checked in service layer)

Example: `GET /api/v1/paths/{id}/tree`:
- Controller gets current user from session
- Service checks: `pathRepository.findByIdAndOwner_Id(pathId, userId)` — only returns if user owns it
- If not owned → 404 Not Found

---

# Part 5: Key Services Deep Dive

## 5.1 AuthService

**Responsibilities**:
- Register new users (hash password, create user, trigger starter paths)
- Authenticate (check email/password)
- Find users by ID or email

**Key methods**:
- `register(email, password)` → creates user, calls `pathService.createStarterPaths(user)`
- `authenticate(email, password)` → returns `Optional<User>`
- `findById(id)`, `findByEmail(email)`

**Dependencies**: `UserRepository`, `PasswordEncoder`, `PathService`

## 5.2 MasteryService

**Responsibilities**:
- Process practice logs (update mastery, unlock nodes)
- Calculate mastery deltas (success +0.15, failures have penalties)
- Update node status (LOCKED → AVAILABLE → MASTERED)

**Key methods**:
- `processLog(user, nodeId, isSuccess, errorCode, durationMs)` → returns `ProcessLogResult`

**Mastery calculation**:
- Success: `+0.15` (clamped 0.0–1.0)
- Execution error: `-0.05`
- Forgot: `-0.15`
- Concept error: `-0.25`

**Status updates**:
- First practice: LOCKED → AVAILABLE
- Score ≥ 0.8: → MASTERED
- Score < 0.8: stays AVAILABLE

**Dependencies**: `UserSkillRepository`, `PerformanceLogRepository`, `NodeRepository`, `UnlockEngine`

## 5.3 UnlockEngine

**Responsibilities**:
- Check if user can practice a node (prerequisites mastered?)
- Check what nodes unlock after completing a node
- Unlock nodes (set status LOCKED → AVAILABLE)

**Key methods**:
- `canUserPractice(user, nodeId)` → true if all prerequisites mastered (or entry node)
- `checkUnlocks(user, completedNode)` → returns list of node IDs that just unlocked

**Logic**:
- Entry node (no prerequisites) → always allowed
- Has prerequisites → all must have `masteryScore >= 0.8` (MASTERY_THRESHOLD)
- When node completed → check all child nodes; if all their prerequisites are now mastered → unlock them

**Dependencies**: `NodePrerequisiteRepository`, `NodeRepository`, `UserSkillRepository`

## 5.4 PathService

**Responsibilities**:
- Get user's paths (filtered by owner)
- Create paths (with owner)
- Build skill tree (nodes + edges + user progress)
- Calculate path stats (total nodes, mastered, review due)
- Get review queue (nodes due for review)
- Create starter paths for new users

**Key methods**:
- `getAllPaths(userId)` → returns only paths owned by that user
- `createPath(owner, name, description)` → creates path with owner
- `getTreeForPath(pathId, userId)` → builds tree with user's mastery per node
- `getPathStats(pathId, userId)` → calculates stats
- `getReviewQueue(pathId, userId, limit)` → nodes due for review
- `createStarterPaths(user)` → creates "Blind 75" and "AMC8" for new user

**Dependencies**: `PathRepository`, `PathNodeRepository`, `NodeRepository`, `NodePrerequisiteRepository`, `UserSkillRepository`

## 5.5 MarketplaceService

**Responsibilities**:
- List published paths (with filters/sort)
- Preview marketplace path (tree without user progress)
- Publish path (copy user's path to marketplace)
- Purchase path (charge buyer, credit author)
- Import path (create new path for user from marketplace)

**Key methods**:
- `listPaths(tag, difficulty, sort, limit)` → filtered/sorted marketplace paths
- `getTreePreview(marketplacePathId)` → tree for preview (no user progress)
- `publishPath(author, pathId, title, description, ...)` → creates `MarketplacePath` + `MarketplacePathNode` rows
- `purchasePath(user, marketplacePathId)` → charges buyer's balance, credits author, creates `MarketplacePurchase`
- `importPath(user, marketplacePathId)` → creates new `Path` owned by user, copies nodes

**Purchase flow**:
1. Check path is paid and user isn't author
2. Check user hasn't already purchased
3. Check buyer has enough `balance_cents`
4. Deduct price from buyer's balance
5. Add price to author's balance
6. Create `MarketplacePurchase` record

**Import flow**:
1. Check if paid → user must have purchased (or be author)
2. Create new `Path` owned by importing user
3. Copy `MarketplacePathNode` → `PathNode` rows
4. Increment `import_count` on marketplace path

**Dependencies**: `MarketplacePathRepository`, `MarketplacePathNodeRepository`, `PathRepository`, `PathNodeRepository`, `MarketplacePurchaseRepository`, `UserRepository`, `AuthService`

## 5.6 DecayService (if exists)

**Responsibilities**:
- Decay mastery over time (if not practiced)
- Create maintenance tasks for review

**Note**: May not be fully implemented yet, but the structure exists.

---

# Part 6: Database Interactions

## How Entities Map to Tables

| Entity | Table | Key Fields |
|--------|-------|------------|
| `User` | `users` | id, email, password_hash, balance_cents, created_at |
| `Path` | `path` | id, user_id (owner), name, description |
| `PathNode` | `path_node` | path_id, node_id, sequence_order (composite PK) |
| `Node` | `node` | id, category_id, name, description, external_key |
| `UserSkill` | `user_skill` | id, user_id, node_id, mastery_score, node_status, last_practiced_at |
| `PerformanceLog` | `performance_log` | id, user_id, node_id, occurred_at, is_success, error_code |
| `MarketplacePath` | `marketplace_path` | id, author_user_id, title, price_cents, is_paid |
| `MarketplacePathNode` | `marketplace_path_node` | marketplace_path_id, node_id, sequence_order |
| `MarketplacePurchase` | `marketplace_purchase` | id, user_id, marketplace_path_id, price_cents |

## Relationships

- **User** → **Path** (one-to-many): `path.user_id → users.id`
- **Path** → **PathNode** (one-to-many): `path_node.path_id → path.id`
- **PathNode** → **Node** (many-to-one): `path_node.node_id → node.id`
- **User** → **UserSkill** (one-to-many): `user_skill.user_id → users.id`
- **UserSkill** → **Node** (many-to-one): `user_skill.node_id → node.id`
- **User** → **PerformanceLog** (one-to-many): `performance_log.user_id → users.id`
- **User** → **MarketplacePath** (one-to-many, as author): `marketplace_path.author_user_id → users.id`

## Transactions

Most service methods that **change data** are `@Transactional`:

- **One transaction per method**: All repository calls in that method run in the same transaction
- **Rollback on exception**: If anything throws, all changes are rolled back
- **Isolation**: Other transactions don't see uncommitted changes

Example: `MasteryService.processLog()` is `@Transactional`:
- Loads Node, UserSkill
- Creates PerformanceLog
- Updates UserSkill
- Checks unlocks (may create new UserSkills)
- All succeed or all fail together

---

# Part 7: Key Features Explained

## 7.1 Personalized Paths

**How it works**:
- Every `Path` has `user_id` (owner)
- `PathRepository.findByOwner_IdOrderByNameAsc(userId)` returns only user's paths
- When creating path: `new Path(owner, name, description)` — owner is required
- When importing from marketplace: creates new `Path` owned by importing user

**Result**: Each user sees only their own paths. No conflicts between users.

## 7.2 Starter Paths for New Users

**When**: User registers (`AuthService.register()`)

**What happens**:
1. User is created
2. `pathService.createStarterPaths(user)` is called
3. Creates "Blind 75" path with 12 nodes (by external_key: lc-1, lc-121, ...)
4. Creates "AMC8" path with 5 nodes (amc8-arith, amc8-pemdas, ...)
5. Both paths owned by new user

**Result**: New users immediately have paths to practice.

## 7.3 Mastery & Unlocks

**Mastery scoring**:
- Starts at 0.0
- Success: +0.15 (max 1.0)
- Failures: penalties (-0.05 to -0.25)

**Node status**:
- **LOCKED**: Can't practice (prerequisites not mastered)
- **AVAILABLE**: Can practice (prerequisites mastered, score < 0.8)
- **MASTERED**: Score ≥ 0.8
- **NEEDS_REVIEW**: Mastered but decayed (not implemented yet)

**Unlocking**:
- Entry nodes (no prerequisites) → always AVAILABLE
- Other nodes → unlocked when **all prerequisites** have `masteryScore >= 0.8`
- When you complete a node → `UnlockEngine.checkUnlocks()` checks all child nodes

## 7.4 Marketplace & Purchases

**Publishing**:
- User selects their path → fills title, description, price
- `MarketplaceService.publishPath()` creates `MarketplacePath` + `MarketplacePathNode` rows
- Frozen snapshot (changes to original path don't affect marketplace version)

**Purchasing**:
- Buyer must have enough `balance_cents`
- Price deducted from buyer, added to author
- `MarketplacePurchase` record created (prevents duplicate purchases)

**Importing**:
- Creates new `Path` owned by importing user
- Copies nodes from marketplace path
- If paid → requires purchase first (or user is author)

## 7.5 User Balance (Wallet)

**Storage**: `users.balance_cents` (integer, cents)

**Default**: New users get 10000 cents ($100.00) from migration V9

**Operations**:
- Purchase: `buyer.balance_cents -= price`, `author.balance_cents += price`
- All in same transaction (atomic)

---

# Part 8: How Everything Fits Together

## Complete Flow: User Practices a Node

1. **Frontend**: User clicks "Start Practice" → timer → submits Success/Fail
2. **HTTP**: POST `/api/v1/logs` with nodeId, isSuccess, errorCode
3. **Controller**: Gets user from session, validates, calls `masteryService.processLog()`
4. **MasteryService**: 
   - Loads Node, UserSkill
   - Checks prerequisites via `UnlockEngine`
   - Creates PerformanceLog
   - Updates mastery score
   - Updates node status
   - Checks unlocks via `UnlockEngine`
5. **UnlockEngine**: Checks child nodes, unlocks if prerequisites mastered
6. **Repository**: Saves UserSkill, PerformanceLog, new UserSkills (unlocked nodes)
7. **Transaction**: Commits all changes
8. **Response**: Returns logId, masteryScore, unlockedNodeIds
9. **Frontend**: Shows result, refreshes tree to show new unlocks

## Complete Flow: User Publishes Path to Marketplace

1. **Frontend**: User selects path → fills publish form → submits
2. **HTTP**: POST `/api/v1/marketplace/publish` with pathId, title, description, priceCents
3. **Controller**: Gets user from session, calls `marketplaceService.publishPath()`
4. **MarketplaceService**:
   - Loads user's Path
   - Loads PathNode rows (ordered)
   - Creates MarketplacePath (with author = user)
   - Creates MarketplacePathNode rows (frozen copy)
5. **Repository**: Saves MarketplacePath, MarketplacePathNode rows
6. **Transaction**: Commits
7. **Response**: Returns MarketplacePathResponse
8. **Frontend**: Shows "Published!" message

## Complete Flow: User Imports Marketplace Path

1. **Frontend**: User browses marketplace → clicks "Import"
2. **HTTP**: POST `/api/v1/marketplace/paths/{id}/import`
3. **Controller**: Gets user from session, calls `marketplaceService.importPath()`
4. **MarketplaceService**:
   - Loads MarketplacePath
   - Checks: if paid, user must have purchased (or be author)
   - Creates new Path (owned by importing user)
   - Copies MarketplacePathNode → PathNode rows
   - Increments import_count
5. **Repository**: Saves Path, PathNode rows, updates MarketplacePath
6. **Transaction**: Commits
7. **Response**: Returns new Path info
8. **Frontend**: Refreshes paths list, shows new path

---

# Part 9: Configuration & Startup

## Application Startup

**MasteryPathApplication.java**:
- `@SpringBootApplication` — enables auto-configuration
- `@EnableScheduling` — allows scheduled tasks (if any)

**On startup**:
1. Spring Boot loads `application.yml`
2. Connects to PostgreSQL (or H2 if profile `h2`)
3. **Flyway runs** (if enabled):
   - Checks `flyway_schema_history` table
   - Runs migrations V1–V10 that haven't been applied
   - Creates/updates schema
4. **SeedDataLoader runs** (only if profile `h2`):
   - Creates demo user, paths, marketplace entries
5. Spring creates beans (controllers, services, repositories)
6. Tomcat starts on port 8080
7. Application ready

## Configuration Files

**application.yml**:
- Database connection (PostgreSQL default)
- Flyway settings (enabled, out-of-order allowed)
- JPA settings (`ddl-auto: validate` — don't create tables, Flyway does)
- Session storage (JDBC)
- CORS (handled in SecurityConfig)

**SecurityConfig.java**:
- CORS configuration (allows frontend origins)
- Session management
- Password encoder (BCrypt)
- Most endpoints `permitAll()` — controllers handle auth

---

# Part 10: Key Design Decisions

## Why Session-Based Auth (Not JWT)?

- **Simpler**: No token refresh logic
- **Server-side control**: Can invalidate sessions immediately
- **Shared sessions**: Multiple backend instances share DB sessions
- **No token storage**: Browser handles cookies automatically

## Why Per-User Paths (Not Global)?

- **Personalization**: Each user has their own learning journey
- **No conflicts**: Users can create paths with same names
- **Privacy**: Users can't see others' paths
- **Flexibility**: Users can customize paths without affecting others

## Why Transactions?

- **Consistency**: All-or-nothing updates (e.g. purchase: deduct buyer + credit author)
- **No partial failures**: If one step fails, everything rolls back
- **Isolation**: Other users don't see uncommitted changes

## Why Repository Pattern?

- **Abstraction**: Services don't write SQL
- **Testability**: Can mock repositories in tests
- **Spring Data JPA**: Automatic implementation from method names
- **Type safety**: Java types, not raw SQL strings

---

# Quick Reference: File Structure

```
backend/src/main/java/com/masterypath/
├── api/                    ← Controllers (HTTP layer)
│   ├── auth/              → AuthController
│   ├── logs/              → LogController
│   ├── paths/             → PathController
│   ├── marketplace/       → MarketplaceController
│   ├── history/           → HistoryController
│   ├── review/            → ReviewController
│   └── analytics/         → AnalyticsController
├── domain/
│   ├── model/             ← Entities (database tables)
│   ├── repo/              ← Repositories (data access)
│   └── service/           ← Services (business logic)
│       ├── AuthService
│       ├── MasteryService
│       ├── PathService
│       ├── MarketplaceService
│       ├── UnlockEngine
│       └── DecayService
├── config/                ← Configuration
│   └── SeedDataLoader
└── infra/
    └── security/
        └── SecurityConfig
```

---

This document gives you a complete picture of how the MasteryPath backend works: architecture, request flow, key components, database interactions, and how everything fits together. Use it as your reference for understanding and extending the backend.
