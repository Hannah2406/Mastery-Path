# 🚀 Quick Start Guide

## Start Everything Automatically

Run this single command:

```bash
./start-everything.sh
```

This script will:
1. ✅ Check and start the PostgreSQL database (via Docker)
2. ✅ Compile and start the Spring Boot backend
3. ✅ Start the React frontend
4. ✅ Show you all the URLs and status

## Manual Start (if script doesn't work)

### 1. Start Database
```bash
docker compose up -d
```

Wait a few seconds for it to start, then verify:
```bash
docker compose ps
```

### 2. Start Backend
```bash
cd backend
mvn spring-boot:run
```

Wait for: `Started MasteryPathApplication`

### 3. Start Frontend (in a new terminal)
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

The frontend will show a URL like: `http://localhost:5173`

## Troubleshooting

### Backend won't start
- **Error: "Connection refused" to PostgreSQL**
  - Make sure database is running: `docker compose ps`
  - Start it: `docker compose up -d`
  - Wait 5-10 seconds for it to be ready

### Frontend shows "Cannot connect to backend"
- Make sure backend is running on port 8080
- Check: `curl http://localhost:8080/api/v1/health`
- Should return: `{"status":"ok"}`

### IntelliJ shows red errors
- Run: `./refresh-intellij.sh`
- In IntelliJ: Right-click `backend` → Maven → Reload Project
- File → Invalidate Caches → Invalidate and Restart

## URLs

- **Frontend**: http://localhost:5173 (or 5174, 5175, etc. - check the terminal)
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/api/v1/health

## Stop Everything

```bash
# Stop backend and frontend
pkill -f 'spring-boot:run'
pkill -f 'vite'

# Stop database
docker compose down
```
