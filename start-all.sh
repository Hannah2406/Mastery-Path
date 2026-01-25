#!/bin/bash

echo "🚀 Starting MasteryPath - Complete Setup"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Step 1: Check Docker
echo -e "${BLUE}📦 Step 1: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Try to start Docker Desktop if not running
if ! docker ps &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Desktop is not running${NC}"
    echo "Attempting to start Docker Desktop..."
    open -a Docker 2>/dev/null || echo "Please start Docker Desktop manually"
    echo "Waiting 15 seconds for Docker to start..."
    sleep 15
    
    # Check again
    if ! docker ps &> /dev/null; then
        echo -e "${RED}❌ Docker Desktop is still not running${NC}"
        echo "Please start Docker Desktop manually and run this script again"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Step 2: Start Database
echo ""
echo -e "${BLUE}📦 Step 2: Starting Database...${NC}"
cd "$(dirname "$0")"

if ! check_port 5433; then
    echo "Starting PostgreSQL with Docker Compose..."
    docker compose up -d
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start database${NC}"
        exit 1
    fi
    
    echo "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker exec masterypath-db pg_isready -U masterypath &> /dev/null; then
            echo -e "${GREEN}✅ Database is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Database failed to start${NC}"
            exit 1
        fi
        sleep 1
    done
else
    echo -e "${GREEN}✅ Database is already running${NC}"
fi

# Step 3: Compile Backend
echo ""
echo -e "${BLUE}☕ Step 3: Compiling Backend...${NC}"
cd backend
mvn clean compile -DskipTests -q

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend compiled successfully${NC}"

# Step 4: Start Backend
echo ""
echo -e "${BLUE}☕ Step 4: Starting Backend...${NC}"
if check_port 8080; then
    echo "Stopping existing backend..."
    pkill -f "spring-boot:run" 2>/dev/null
    pkill -f "MasteryPathApplication" 2>/dev/null
    sleep 2
fi

echo "Starting Spring Boot backend..."
mvn spring-boot:run -DskipTests > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
for i in {1..60}; do
    if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running on http://localhost:8080${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        echo "Check backend.log for errors:"
        tail -30 ../backend.log
        exit 1
    fi
    sleep 1
done

# Step 5: Start Frontend
echo ""
echo -e "${BLUE}⚛️  Step 5: Starting Frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Find available port
FRONTEND_PORT=5173
for port in 5173 5174 5175 5176 5177 5178; do
    if ! check_port $port; then
        FRONTEND_PORT=$port
        break
    fi
done

echo "Starting Vite dev server on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 8

# Check frontend
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    FRONTEND_URL="http://localhost:$FRONTEND_PORT"
    echo -e "${GREEN}✅ Frontend is running on $FRONTEND_URL${NC}"
else
    FRONTEND_URL="http://localhost:$FRONTEND_PORT"
    echo -e "${YELLOW}⚠️  Frontend may still be starting on $FRONTEND_URL${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Everything is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📍 Services:${NC}"
echo "   🗄️  Database: localhost:5433"
echo "   ☕ Backend:   http://localhost:8080"
echo "   ⚛️  Frontend:  $FRONTEND_URL"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop everything:${NC}"
echo "   ./stop-all.sh"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
