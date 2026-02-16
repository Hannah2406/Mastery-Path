# Data persistence – paths, marketplace, accounts

**Your data (accounts, paths, marketplace) is stored in PostgreSQL and persists across restarts and replays.**

## How to keep data persistent

1. **Start the database first** (once per boot or after closing Docker):
   ```bash
   docker compose up -d
   ```
2. **Start the backend with the default config** (no profile):
   ```bash
   cd backend && mvn spring-boot:run
   ```
   Do **not** use `-Dspring-boot.run.profiles=h2` if you want persistent data.

3. **Or use the all-in-one script** (starts database + backend + frontend):
   ```bash
   ./start-all.sh
   ```

Data lives in a **Docker volume**. It survives:
- Backend restarts  
- Computer restarts  
- Closing the terminal  

It is only removed if you run `docker compose down -v` (the `-v` deletes the volume).

## What you get with PostgreSQL (default)

- **One shared database** for all users: same marketplace, same seed paths.
- **Flyway migrations** run on first start and create:
  - Categories and nodes (Blind 75, AMC8, etc.)
  - Seed paths (Blind 75, AMC8) owned by the demo user
  - Marketplace entries (published paths) for everyone to see and import
- **New users**: when you register, you get your own copy of starter paths and you see the full marketplace.

## If the backend won’t start

If you see “Connection to localhost:5433 refused”:

1. Start PostgreSQL: `docker compose up -d`
2. Wait a few seconds, then start the backend again (without the `h2` profile).

## H2 profile (avoid for real use)

The `h2` profile uses a local file database. It is **not** shared, can be lost if you run from a different folder or machine, and is only for quick local experiments. **Do not use it if you care about keeping your data.**
