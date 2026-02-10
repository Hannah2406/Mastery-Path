# MasteryPath MVP — Working 100% Functional Prototype

The app uses **PostgreSQL by default** so that many computers can connect to the same database and everyone sees the same users, paths, and marketplace.

## Quick Start (recommended: one shared database)

### 1. Start the database
```bash
docker compose up -d
```
Wait for PostgreSQL to be ready (port 5433).

### 2. Start the backend
```bash
cd backend
mvn spring-boot:run
```
No profile needed — it connects to PostgreSQL. Flyway runs migrations and seeds paths + marketplace.

### 3. Start the frontend
```bash
cd frontend
npm install   # first time only
npm run dev
```
Open the URL shown (e.g. http://localhost:5173).

### 4. Use the app
- **Register** with any email and password (e.g. `test@test.com` / `test1234`)
- **Login** with the same credentials
- **Choose a path**: Blind 75 or AMC8 (or import from Marketplace)
- **Skill tree**: Click a node → **Start Practice** → log Success/Fail
- **Marketplace**: All published paths are visible to every account

## Running on many computers (shared data)

Every instance that uses the **same** PostgreSQL database shares data:

- **Same DB server:** Point all backends to one PostgreSQL (e.g. one machine runs Docker Postgres, or you use a cloud DB).
- **Override connection** with environment variables (no code change):
  ```bash
  export SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_DB_HOST:5433/masterypath
  export SPRING_DATASOURCE_USERNAME=masterypath
  export SPRING_DATASOURCE_PASSWORD=yourpassword
  mvn spring-boot:run
  ```
- All users, paths, and marketplace items are then the same on every computer that connects to that DB.

## One-command start (backend + DB + frontend)

From the project root:
```bash
./start-all.sh
```
This starts Docker Postgres, the backend (PostgreSQL), and the frontend.

## Optional: H2 (no Docker, local-only data)

If you want to run without Docker and don’t need shared data:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
Uses a file-based H2 database under `./data/`. Data is local to that machine only.

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.2, Spring Security, JPA/Hibernate, **PostgreSQL (default)** / H2 (optional profile)
- **Frontend:** React 18, Vite, Tailwind CSS, React Flow (@xyflow/react)

## Summary

- **Default:** PostgreSQL. One database → same data and marketplace for all accounts and all instances.
- **Many computers:** Set `SPRING_DATASOURCE_URL` (and credentials) to your shared PostgreSQL; run the backend on each computer.
- **Optional H2:** Use profile `h2` for local dev without Docker (data not shared).
