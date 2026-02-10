# MasteryPath Backend — How Classes Work Together

This document explains the backend architecture so you can understand and extend the code yourself.

---

## 1. The Big Picture: Layers

The backend is organized in **layers**. Each layer has a clear job. Data and requests flow **in one direction**:

```
  HTTP Request
       ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  API LAYER (api/)                                            │
  │  Controllers: receive HTTP, validate input, call services,   │
  │  return HTTP response (JSON).                                │
  └─────────────────────────────────────────────────────────────┘
       ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  SERVICE LAYER (domain/service/)                             │
  │  Business logic: rules, calculations, orchestration.         │
  │  Uses repositories and other services.                       │
  └─────────────────────────────────────────────────────────────┘
       ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  REPOSITORY LAYER (domain/repo/)                             │
  │  Data access: load/save entities to the database.            │
  │  Interfaces only; Spring implements them.                   │
  └─────────────────────────────────────────────────────────────┘
       ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  MODEL LAYER (domain/model/)                                 │
  │  Entities: User, Node, UserSkill, PerformanceLog, etc.      │
  │  Map to database tables (JPA/Hibernate).                    │
  └─────────────────────────────────────────────────────────────┘
       ↓
  Database (Postgres or H2)
```

**Rule of thumb:**  
- **Controllers** don’t contain business logic; they delegate to **services**.  
- **Services** don’t write SQL or HTTP; they use **repositories** and return domain objects or simple result types.  
- **Repositories** don’t contain business rules; they only load/save **models**.

---

## 2. Folder Structure and What Each Package Does

```
backend/src/main/java/com/masterypath/
├── api/                    ← API layer (HTTP entry points)
│   ├── auth/               → Login, register (AuthController + DTOs)
│   ├── history/            → Logs, stats, heatmap (HistoryController + DTOs)
│   ├── logs/               → Create practice log (LogController + DTOs)
│   ├── paths/              → Paths, tree, stats, problems (PathController + DTOs)
│   ├── review/             → Review queue (ReviewController)
│   ├── analytics/          → Analytics summary (AnalyticsController + DTOs)
│   ├── HealthController.java
│   └── GlobalExceptionHandler.java
│
├── config/                 ← Startup / config (e.g. SeedDataLoader)
│
├── domain/                 ← Core business and data
│   ├── model/              → Entities (database tables)
│   │   ├── User.java, Node.java, UserSkill.java, PerformanceLog.java, ...
│   │   └── enums/          → NodeStatus, ErrorCode
│   ├── repo/               → Data access (one interface per entity type)
│   │   ├── UserRepository.java, UserSkillRepository.java, ...
│   └── service/            → Business logic
│       ├── AuthService.java
│       ├── MasteryService.java   → “What happens when you log a practice?”
│       ├── PathService.java      → “How do we build the tree and stats?”
│       ├── UnlockEngine.java     → “When is a node unlocked?”
│       └── DecayService.java      → “When does mastery decay?”
│
├── infra/                  ← Infrastructure (e.g. SecurityConfig)
│
└── MasteryPathApplication.java   ← Spring Boot entry point
```

- **api/**  
  - **Controllers**: handle HTTP (method, path, request body, session).  
  - **DTOs** (in `dto/` subpackages): request/response shapes (e.g. `CreateLogRequest`, `LogResponse`). Controllers convert between DTOs and domain objects.

- **domain/model/**  
  - **Entities**: one class per main table (e.g. `User`, `UserSkill`, `PerformanceLog`).  
  - Annotations like `@Entity`, `@Table`, `@Column` define how they map to the DB.

- **domain/repo/**  
  - **Repositories**: interfaces extending `JpaRepository<Entity, Id>`.  
  - You declare methods like `findByUserIdAndNodeId`; Spring Data JPA implements them.  
  - No business logic here—only “get this entity” or “save this entity.”

- **domain/service/**  
  - **Services**: contain the “what” and “when” of your app (e.g. “when user logs a practice, update mastery and check unlocks”).  
  - They use repositories and other services, and are used by controllers.

---

## 3. How One Request Flows: Example “Log a Practice”

When the frontend sends `POST /api/v1/logs` with `{ nodeId, isSuccess, errorCode?, durationMs }`, this is what happens step by step.

### Step 1: Controller (API layer)

**File:** `api/logs/LogController.java`

- Spring maps `POST /api/v1/logs` to `createLog(...)`.
- Controller:
  1. Gets current user from session (via `AuthService`).
  2. If no user → returns 401 Unauthorized.
  3. Validates body (e.g. “if fail, errorCode required”).
  4. Calls **one** service method:  
     `masteryService.processLog(user, nodeId, isSuccess, errorCode, durationMs)`.
  5. Converts the service result into a DTO (`LogResponse`) and returns 201 + JSON.

So the controller’s job is: **HTTP ↔ service call and DTOs**. It does **not** decide how mastery or unlocks work.

### Step 2: Service (business logic)

**File:** `domain/service/MasteryService.java`

- `processLog(...)` does the real work:
  1. Load **Node** from DB (via `nodeRepository.findById(nodeId)`).
  2. Check if user is allowed to practice that node (via `unlockEngine.canUserPractice(...)`); if not, throw.
  3. **Find or create** **UserSkill** for this user+node (via `userSkillRepository.findByUserIdAndNodeId` or create new).
  4. **Create and save** a **PerformanceLog** (via `performanceLogRepository.save(...)`).
  5. **Update** the UserSkill:  
     - `applyDelta(...)`: change mastery score (success +0.15, fail −penalty).  
     - `updateStatus(...)`: set LOCKED→AVAILABLE, or score≥0.8→MASTERED, etc.
  6. Save the updated UserSkill.
  7. Ask **UnlockEngine** which nodes just unlocked: `unlockEngine.checkUnlocks(user, node)`.
  8. Return a result object: `ProcessLogResult(logId, userSkill, unlockedNodeIds)`.

So the service talks only to:

- **Repositories** (to load/save `Node`, `UserSkill`, `PerformanceLog`).
- **UnlockEngine** (another service) for “can practice?” and “what unlocked?”.

No HTTP, no JSON—only domain objects and IDs.

### Step 3: Repository (data access)

**File:** `domain/repo/UserSkillRepository.java` (and others)

- `UserSkillRepository` is an **interface** extending `JpaRepository<UserSkill, Long>`.
- Methods like `findByUserIdAndNodeId(Long userId, Long nodeId)` are implemented by Spring from the method name (and `@Query` when needed).
- When the service calls `userSkillRepository.save(skill)`, Spring turns that into an INSERT or UPDATE in the database.

So repositories are the **only** place that “talks” to the database. Services and controllers don’t write SQL.

### Step 4: Model (entities)

**File:** `domain/model/UserSkill.java`

- `UserSkill` is a plain Java class with fields: `user`, `node`, `masteryScore`, `nodeStatus`, `lastPracticedAt`, `lastSuccessfulAt`.
- `@Entity` and `@Table(name = "user_skill")` tell JPA which table to use.
- Repositories load and save these objects; services read and change their fields, then call `repository.save(...)`.

---

## 4. How Classes Depend on Each Other (Dependency Direction)

- **Controllers** depend on **Services** (and sometimes Repositories for very simple reads).
- **Services** depend on **Repositories** and sometimes other **Services**.
- **Repositories** depend only on **Models** (the entity type they manage).
- **Models** depend only on other **Models** or enums; they don’t know about controllers or HTTP.

Spring **injects** these dependencies via constructors. Example:

```java
// LogController
public LogController(MasteryService masteryService, AuthService authService) {
    this.masteryService = masteryService;
    this.authService = authService;
}

// MasteryService
public MasteryService(UserSkillRepository userSkillRepository,
                      PerformanceLogRepository performanceLogRepository,
                      NodeRepository nodeRepository,
                      UnlockEngine unlockEngine) {
    this.userSkillRepository = userSkillRepository;
    // ...
}
```

You never write `new MasteryService(...)` in the controller; Spring creates one instance of each service and repository and passes them in. That’s **dependency injection (DI)**.

---

## 5. Naming and Patterns Used in This Codebase

| Layer      | Naming pattern        | Example                          |
|-----------|------------------------|----------------------------------|
| Controller| `*Controller`          | `LogController`, `PathController`|
| Service   | `*Service` or `*Engine`| `MasteryService`, `UnlockEngine` |
| Repository| `*Repository`          | `UserSkillRepository`            |
| Model     | Entity name            | `UserSkill`, `PerformanceLog`    |
| Request   | `*Request`             | `CreateLogRequest`               |
| Response  | `*Response`            | `LogResponse`, `TreeResponse`    |

- **Controllers**: `@RestController`, `@RequestMapping("/api/v1/...")`, `@GetMapping` / `@PostMapping`, etc.
- **Services**: `@Service`, `@Transactional` when they change data.
- **Repositories**: `@Repository`, extend `JpaRepository<Entity, Id>`.
- **Models**: `@Entity`, `@Table`, `@Column`, getters/setters (or records in newer style).

---

## 6. How to Add a New Feature Yourself (Step-by-Step)

Example: **“Add an endpoint that returns the next recommended practice node.”**

1. **Decide the HTTP contract**  
   e.g. `GET /api/v1/review/next?pathId=1` → returns one node (or 404).

2. **Add or reuse a Controller**  
   - Either in an existing controller (e.g. `ReviewController`) or a new one.  
   - Map the URL, get `pathId` and user from session, call a service method, convert result to a DTO, return ResponseEntity.

3. **Add or reuse a Service method**  
   - e.g. `PathService.getNextRecommendedNode(pathId, userId)` or `ReviewService.getNext(pathId, userId)`.  
   - Implement the rule: “next = first from review queue” or “first available by order,” using:  
     - `pathService.getReviewQueue(...)`  
     - or repositories: `UserSkillRepository`, `PathNodeRepository`, etc.  
   - Return a `Node` or `Optional<Node>` (or a small result object). No HTTP or JSON here.

4. **Use existing Repositories**  
   - You usually don’t need a new repository; use `UserSkillRepository`, `PathNodeRepository`, etc.  
   - If you need a new query, add a method to the right repository interface (e.g. `findNextRecommended(...)` with `@Query`).

5. **Response DTO**  
   - If the response shape is new, add a class under `api/.../dto/`, e.g. `NextNodeResponse.java`, and in the controller build it from the service result.

6. **Optional: new table**  
   - Only if you need new persistent data: add a new entity in `domain/model/`, a new repository in `domain/repo/`, and a Flyway migration `V*.sql` that creates the table.

Summary: **Controller → Service → Repository → Model**. Keep HTTP and DTOs in the API layer; keep rules and orchestration in the service layer; keep data access in the repository layer.

---

## 7. Quick Reference: Who Calls Whom

```
AuthController     → AuthService
LogController      → MasteryService, AuthService
PathController     → PathService, ProblemRepository
HistoryController  → PerformanceLogRepository, UserSkillRepository, AuthService
ReviewController   → PathService, AuthService
AnalyticsController → PerformanceLogRepository, UserSkillRepository, AuthService

MasteryService     → UserSkillRepository, PerformanceLogRepository, NodeRepository, UnlockEngine
PathService        → PathRepository, PathNodeRepository, NodeRepository, NodePrerequisiteRepository, UserSkillRepository
UnlockEngine       → NodePrerequisiteRepository, NodeRepository, UserSkillRepository
DecayService       → UserSkillRepository
AuthService        → UserRepository
```

This is the “how the classes work together” picture: controllers call services, services call repositories (and other services), and repositories load/save domain models. If you follow this layout when you write new code, the codebase stays clear and you can extend it yourself later.
