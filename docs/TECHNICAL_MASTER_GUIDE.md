# MasteryPath — Technical Master Guide

This guide explains how **everything** in the project works: frontend, backend, database, how they connect, containers, and how to replicate it from scratch.

---

## Part 1: What Runs Where (Big Picture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  YOUR BROWSER (localhost:5173)                                               │
│  • React app (Vite dev server)                                                │
│  • User clicks "Login" → fetch("/api/v1/auth/login", { credentials: 'include' })
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  HTTP (same-origin thanks to Vite proxy: /api → localhost:8080)
         │  Cookies/session sent automatically (credentials: 'include')
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (localhost:8080) — Spring Boot                                      │
│  • Receives /api/v1/auth/login                                                │
│  • AuthController → AuthService → UserRepository                              │
│  • Creates HttpSession, stores userId, returns JSON                           │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  JDBC (when profile=postgres: localhost:5433)
         │  Or H2 in-memory (default profile)
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATABASE                                                                    │
│  • PostgreSQL in Docker (port 5433) — when you run with postgres profile     │
│  • OR H2 in-memory (no Docker) — default, data lost on restart              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Summary:**
- **Frontend:** React + Vite on port 5173 (or 5174, etc.). Serves HTML/JS; all API calls go to `/api` and are **proxied** to the backend.
- **Backend:** Spring Boot on port 8080. Exposes REST APIs under `/api/v1/*`. Uses **session-based auth** (cookie with session id).
- **Database:** PostgreSQL in Docker (container `masterypath-db`, port 5433) when you use profile `postgres`; otherwise H2 in-memory.

---

## Part 2: Tech Stack

| Layer      | Technology | Purpose |
|------------|------------|--------|
| **Frontend** | React 18 | UI components, state |
| | Vite | Dev server, build tool, **proxy** (/api → 8080) |
| | Tailwind CSS | Styling |
| | React Flow (@xyflow/react) | Skill tree graph |
| **Backend** | Java 17+ | Language |
| | Spring Boot 3 | Web server, DI, security, JPA |
| | Spring Data JPA | Repositories (no raw SQL) |
| | Spring Security | CORS, password encoding, session |
| | Flyway | Database migrations (when postgres profile) |
| **Database** | PostgreSQL 16 | Persistent DB (Docker) |
| | H2 | In-memory DB (default, no Docker) |
| **Containers** | Docker + Docker Compose | Runs only Postgres (not the app) |

---

## Part 3: How Frontend and Backend Connect

### 3.1 Same-Origin and Proxy

- The browser loads the app from `http://localhost:5173`.
- API calls are made to `http://localhost:5173/api/v1/...` (same origin).
- **Vite proxy** (in `frontend/vite.config.js`) forwards any request to `/api` to `http://localhost:8080`. So the browser never talks to 8080 directly; it always talks to 5173, and Vite forwards.

```js
// frontend/vite.config.js
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
  },
},
```

- So: **Browser → Vite (5173) → Backend (8080)**. Same-origin so cookies work.

### 3.2 Authentication: Session + Cookie

- **Login:** Frontend POSTs email/password to `/api/v1/auth/login`. Backend checks credentials, creates an `HttpSession`, stores `userId` in the session, and returns user JSON. Spring sends back a **cookie** (e.g. `JSESSIONID=...`).
- **Later requests:** Frontend sends `credentials: 'include'` on every `fetch`, so the browser automatically sends that cookie. Backend reads the session, gets `userId`, and knows who is logged in.
- **Logout:** Frontend POSTs to `/api/v1/auth/logout`. Backend invalidates the session.

No JWT in this project — it’s **server-side session + cookie**.

### 3.3 CORS (Backend Allows Frontend Origin)

- Backend runs on 8080; if the frontend ever called 8080 directly (e.g. from another port), the browser would enforce CORS.
- `SecurityConfig.java` allows origins like `http://localhost:5173`, `http://localhost:5174`, etc., and `AllowCredentials(true)` so cookies are accepted.

So:
- **With proxy:** Browser only talks to 5173 → no CORS issue (same origin).
- **Without proxy (e.g. production):** You’d set backend CORS to your frontend origin (e.g. `https://myapp.com`).

---

## Part 4: Backend in Depth

### 4.1 Entry Point

- `MasteryPathApplication.java` — `@SpringBootApplication`. Running this starts the embedded server (Tomcat) on port 8080 and loads all beans (controllers, services, repos).

### 4.2 Layers (Request Flow Example: Login)

1. **HTTP:** `POST /api/v1/auth/login` with body `{ "email": "...", "password": "..." }`.

2. **Controller** (`api/auth/AuthController.java`):
   - Receives the request, parses body into `LoginRequest` (DTO).
   - Calls `authService.authenticate(email, password)`.
   - If success: gets `HttpSession` from the request, stores `userId` in session, returns `UserResponse` (JSON).
   - If failure: returns 401 with `{ "error": "Invalid email or password" }`.

3. **Service** (`domain/service/AuthService.java`):
   - Uses `UserRepository.findByEmail(email)` to load the user.
   - Uses `PasswordEncoder.matches(password, user.getPasswordHash())` to check the password.
   - Returns `Optional<User>`.

4. **Repository** (`domain/repo/UserRepository.java`):
   - Extends `JpaRepository<User, Long>`. Spring Data implements it: `findByEmail` runs a SQL `SELECT ... WHERE email = ?`.

5. **Model** (`domain/model/User.java`):
   - JPA entity: maps to table `users` (id, email, password_hash, created_at).

So: **Controller → Service → Repository → Database**. Controller and service don’t know SQL; repository and JPA handle it.

### 4.3 Key Packages and Files

| Path | Role |
|------|------|
| `api/auth/` | AuthController, LoginRequest, RegisterRequest, UserResponse |
| `api/paths/` | PathController, path/tree/stats, CreatePathRequest, PathResponse, TreeResponse |
| `api/logs/` | LogController — create practice log (success/fail) |
| `api/history/` | HistoryController — logs list, stats, heatmap |
| `api/review/` | ReviewController — review queue |
| `api/analytics/` | AnalyticsController — analytics summary |
| `api/marketplace/` | MarketplaceController — publish, list, purchase, import |
| `api/HealthController` | GET /api/v1/health |
| `api/GlobalExceptionHandler` | Converts exceptions to JSON error responses |
| `domain/model/` | Entities: User, Path, Node, PathNode, UserSkill, PerformanceLog, MarketplacePath, etc. |
| `domain/repo/` | JpaRepository interfaces: UserRepository, PathRepository, NodeRepository, ... |
| `domain/service/` | AuthService, PathService, MasteryService, UnlockEngine, DecayService, MarketplaceService |
| `infra/security/SecurityConfig` | CORS, CSRF off, session, password encoder |

### 4.4 How a Feature Is Wired (e.g. “Create Path”)

- **API:** `POST /api/v1/paths` with body `{ "name": "...", "description": "..." }`.
- **PathController.createPath:** Receives `CreatePathRequest`, calls `pathService.createPath(name, description)`.
- **PathService.createPath:** Ensures unique name (appends " (2)" if needed), creates `Path` entity, saves via `pathRepository.save(path)`.
- **PathRepository:** `JpaRepository<Path, Long>` — `save` does INSERT.
- **Response:** Controller returns 201 with `PathResponse.from(path)` (id, name, description).

No DTO in the database — only entities. DTOs are for API request/response only.

---

## Part 5: Frontend in Depth

### 5.1 Entry Point

- `frontend/index.html` — has `<div id="root">`.
- `frontend/src/main.jsx` — `createRoot(document.getElementById('root')).render(<App />)`.
- So: **main.jsx** renders **App.jsx**.

### 5.2 App Structure

- `App.jsx` wraps the app in `AuthProvider` (context). So either:
  - **AuthPage** (login/register) if not logged in, or
  - **Dashboard** if logged in.
- **Dashboard** holds top-level state: `selectedPath`, `practiceNode`, `practiceResult`, `activeTab`, `showHistory`, `showMarketplace`, etc. It renders:
  - Header (logo, path name, Map/Review/Analytics tabs, Marketplace, History, Profile, Logout)
  - Sidebar (when a path is selected): Today stats, Legend, “Publish to Marketplace”
  - Main content: PathSelector **or** SkillTree / ReviewQueue / AnalyticsDashboard **or** PracticeSession / PracticeResult / PracticeHistory **or** MarketplaceBrowser
- Modals: ProfileModal, PublishToMarketplaceModal (when open).

So: **One big layout**; what you see depends on `selectedPath`, `practiceNode`, `showHistory`, `showMarketplace`, `activeTab`.

### 5.3 API Layer

- `frontend/src/api/` — one file per “domain”: `auth.js`, `paths.js`, `logs.js`, `history.js`, `marketplace.js`, `review.js`, `analytics.js`, `problems.js`.
- Each exports async functions that `fetch` the backend with `credentials: 'include'` and return parsed JSON. Example:

```js
// api/auth.js
export async function login(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}
```

- Components never call `fetch` directly; they call these API functions.

### 5.4 Auth Context

- `context/AuthContext.jsx` — provides `user`, `loading`, `login`, `register`, `logout`.
- On load, it calls `getMe()` (GET /api/v1/auth/me). If 200, it sets `user`; else `user` is null (show login screen).
- Login/register forms call `login()` / `register()` from context; context updates `user`, so the app re-renders and shows the dashboard.

### 5.5 How a Feature Is Wired (e.g. “Marketplace”)

- User clicks “Marketplace” in header → `setShowMarketplace(true)`.
- Dashboard renders `MarketplaceBrowser` with props: `onClose`, `onMakeYourOwn`, `onImportPath`.
- `MarketplaceBrowser` uses `getMarketplacePaths()` from `api/marketplace.js` to load data, then renders cards. “Import” calls `importPath(id)` from the same API file, then `onImportPath(newPath)` and `onClose()` so the app switches to the new path.

So: **Component → API module → fetch (with proxy) → backend**. State lives in App/Dashboard or in the component (e.g. list of paths, loading, error).

---

## Part 6: Database and How Backend Connects

### 6.1 Two Modes

| Profile | When | Database | How |
|--------|------|----------|-----|
| **default** | No profile or no Docker | H2 in-memory | `application.yml`: jdbc:h2:mem:masterypath. Flyway disabled; Hibernate can create schema. Data lost on restart. |
| **postgres** | You pass `-Dspring-boot.run.profiles=postgres` | PostgreSQL | `application.yml` (profile `postgres`): jdbc:postgresql://localhost:5433/masterypath, user/password masterypath. Flyway enabled, runs migrations from `db/migration/`. |

### 6.2 Migrations (Flyway)

- In `backend/src/main/resources/db/migration/`:
  - **V1** — Core schema (users, path, node, path_node, user_skill, performance_log, etc.).
  - **V2** — Seed data (categories, paths like Blind 75 / AMC8, nodes).
  - **V3–V5** — Problems, AMC8 content.
  - **V6** — Marketplace tables (marketplace_path, marketplace_path_node).
  - **V7** — Marketplace pricing (price_cents, is_paid, marketplace_purchase).
  - **V7_1** — Demo user.
  - **V8** — Seed marketplace paths.

- When the backend starts with profile `postgres`, Flyway runs these in order and creates/updates tables. So the “database” is defined by these SQL files, not by Hibernate auto-DDL in production.

### 6.3 How Backend Connects to the Database

- Spring Boot reads `spring.datasource.url`, `username`, `password` from `application.yml` (and the active profile).
- It creates a `DataSource` and passes it to JPA/Hibernate and to Flyway (when enabled).
- Repositories use the `DataSource` under the hood. You never open a connection yourself; you call `repository.findById(...)` and Spring runs the SQL.

So: **Config (application.yml) → DataSource → JPA + Flyway**. No manual “connect” call in your code.

---

## Part 7: Containers (Docker) and How to Connect

### 7.1 What Is Containerized

- **Only PostgreSQL** is in Docker. The app (frontend + backend) runs on your host (not in Docker in this project).
- `docker-compose.yml` defines one service: `postgres`, image `postgres:16-alpine`, container name `masterypath-db`, port **5433:5432**, volume `postgres_data`, env POSTGRES_DB/USER/PASSWORD = masterypath.

### 7.2 How Backend Connects to the Container

- Backend runs on your Mac. It connects to the DB at **localhost:5433** because Docker maps container port 5432 to host 5433.
- So from the host, “the database” is at `localhost:5433`. No need to use the container IP; localhost is correct.

### 7.3 How to Run Everything

1. **Start DB:** `docker compose up -d` (or `docker start masterypath-db`).
2. **Start backend with Postgres:**  
   `cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=postgres`
3. **Start frontend:**  
   `cd frontend && npm run dev`

Or use `./start-all.sh`, which starts Docker, then backend with postgres profile, then frontend.

### 7.4 Connecting Other Tools to the Database

- **From your Mac:** Host `localhost`, port `5433`, database `masterypath`, user `masterypath`, password `masterypath`.
- **From another container (if you had one):** You’d use the Docker network and the service name (e.g. `postgres:5432`) and the same credentials. In this project the app is not in Docker, so you only need localhost:5433.

---

## Part 8: Replicate From Scratch (Step-by-Step)

### 8.1 Backend (Spring Boot + Postgres)

1. **New project:** Use [start.spring.io](https://start.spring.io): Java 17, Spring Boot 3.x, dependencies: Web, Data JPA, PostgreSQL Driver, Flyway, Validation, Security.
2. **application.yml:** Default profile: H2 in-memory (optional). Another profile `postgres`: `spring.datasource.url=jdbc:postgresql://localhost:5433/yourdb`, username/password, `spring.flyway.enabled=true`, `spring.flyway.locations=classpath:db/migration`.
3. **Security:** Create `SecurityConfig` — CORS (allow your frontend origin, allowCredentials true), CSRF disable, permitAll or custom rules.
4. **Package layout:** `api/` (controllers + dto), `domain/model`, `domain/repo`, `domain/service`, `infra/security`.
5. **Entity:** e.g. `User` with `@Entity`, `@Table(name = "users")`, id, email, passwordHash. Repository: `interface UserRepository extends JpaRepository<User, Long>`.
6. **Migration:** Create `src/main/resources/db/migration/V1__create_users.sql` with `CREATE TABLE users (...);`.
7. **Service:** e.g. `AuthService` — register (encode password, save user), authenticate (findByEmail, match password).
8. **Controller:** e.g. `AuthController` — POST /register, POST /login (create session, set userId in session), GET /me (read session, return user).
9. **Run:** Start Postgres (Docker or local), then `mvn spring-boot:run -Dspring-boot.run.profiles=postgres`.

### 8.2 Database (Postgres in Docker)

1. **docker-compose.yml** in project root:
   - Service `postgres`, image `postgres:16-alpine`, ports `5433:5432`, environment POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, volume for data.
2. Run: `docker compose up -d`. Connect from host at localhost:5433 with the same user/password.

### 8.3 Frontend (React + Vite)

1. **New project:** `npm create vite@latest myapp -- --template react`, then `cd myapp && npm install`.
2. **Proxy:** In `vite.config.js`, add `server.proxy`: `/api` → `http://localhost:8080`.
3. **API module:** e.g. `src/api/auth.js` — `login(email, password)` → `fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })`, then parse JSON and return or throw.
4. **Auth context:** Create React context that holds `user`, `login`, `logout`. On mount, call GET /api/v1/auth/me with `credentials: 'include'`; if 200 set user, else null. Provide context to the whole app.
5. **App.jsx:** If no user, show login form (calls context.login); if user, show dashboard. Login form calls API then context.setUser so UI updates.
6. **Run:** `npm run dev`. Browser hits 5173; API calls go to 5173/api and get proxied to 8080.

### 8.4 End-to-End Flow to Replicate

1. User opens http://localhost:5173.
2. App loads, AuthContext runs getMe(). Request goes to 5173/api/v1/auth/me → proxied to 8080. Backend reads session; if no session, 401. Frontend sets user = null, shows login.
3. User submits login. Frontend calls login(email, password) → POST 5173/api/v1/auth/login → 8080. Backend validates, creates session, sets cookie, returns user. Frontend sets user in context, re-renders dashboard.
4. Next request (e.g. GET paths): fetch with credentials: 'include'. Cookie sent; backend session has userId; returns data. Frontend shows it.

You’ve replicated: **React + Vite (proxy) + Spring Boot (session) + Postgres (Docker)**.

---

## Part 9: File Reference (Where to Look)

| What you want | Where to look |
|---------------|----------------|
| Backend entry, port | `MasteryPathApplication.java`, `application.yml` server.port |
| DB connection (Postgres) | `application.yml` (profile `postgres`) |
| API routes | `api/*/` controllers — `@RequestMapping`, `@GetMapping`, `@PostMapping` |
| Business logic | `domain/service/*.java` |
| Database tables | `domain/model/*.java` (entities) and `db/migration/*.sql` |
| Frontend entry | `main.jsx`, `App.jsx` |
| API calls from frontend | `frontend/src/api/*.js` |
| Auth state | `context/AuthContext.jsx` |
| Proxy (frontend → backend) | `frontend/vite.config.js` server.proxy |
| CORS / security | `infra/security/SecurityConfig.java` |
| Start DB | `docker-compose.yml`, `docker compose up -d` |
| Run backend with DB | `mvn spring-boot:run -Dspring-boot.run.profiles=postgres` |
| Run frontend | `cd frontend && npm run dev` |

---

## Part 10: One-Page Diagram

```
Browser (localhost:5173)
    │
    │  fetch('/api/v1/...', { credentials: 'include' })
    ▼
Vite dev server (5173)  ──proxy /api──►  Spring Boot (8080)
    │                                        │
    │                                        │  JPA / JDBC
    │                                        ▼
    │                                   PostgreSQL (5433)
    │                                   in Docker (masterypath-db)
    │
    └── Serves index.html, main.jsx, App.jsx, components, api/*.js
```

You now have a single place to understand: **how everything connects**, **what each layer does**, and **how to replicate it** from scratch. Use this doc together with `ARCHITECTURE.md` (backend layers) and `DATABASE.md` (tables and access).
