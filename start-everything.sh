#!/bin/bash

echo "🚀 Starting MasteryPath Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Step 1: Check and start database
echo "📦 Step 1: Checking database..."
if ! check_port 5433; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running on port 5433${NC}"
    echo "Starting database with Docker Compose..."
    
    if command -v docker &> /dev/null; then
        cd "$(dirname "$0")"
        docker compose up -d
        echo "Waiting for database to be ready..."
        sleep 5
        
        if check_port 5433; then
            echo -e "${GREEN}✅ Database is running${NC}"
        else
            echo -e "${RED}❌ Database failed to start. Please check Docker.${NC}"
            echo "You can start it manually with: docker compose up -d"
            exit 1
        fi
    else
        echo -e "${RED}❌ Docker not found. Please install Docker or start PostgreSQL manually on port 5433${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Database is already running${NC}"
fi

# Step 2: Start backend
echo ""
echo "☕ Step 2: Starting backend..."
if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use. Stopping existing backend...${NC}"
    pkill -f "spring-boot:run" 2>/dev/null
    pkill -f "MasteryPathApplication" 2>/dev/null
    sleep 2
fi

cd "$(dirname "$0")/backend"
echo "Compiling backend..."
mvn clean compile -DskipTests -q

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend compilation failed${NC}"
    exit 1
fi

echo "Starting Spring Boot backend..."
mvn spring-boot:run -DskipTests > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 10

# Check if backend started
for i in {1..30}; do
    if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running on http://localhost:8080${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log for errors${NC}"
        echo "Last 20 lines of backend.log:"
        tail -20 ../backend.log
        exit 1
    fi
    sleep 1
done

# Step 3: Start frontend
echo ""
echo "⚛️  Step 3: Starting frontend..."
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
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

sleep 5

# Check if frontend started
if grep -q "Local:" ../frontend.log 2>/dev/null; then
    FRONTEND_URL=$(grep "Local:" ../frontend.log | tail -1 | sed 's/.*Local: *//' | sed 's/ *$//')
    echo -e "${GREEN}✅ Frontend is running on $FRONTEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting. Check frontend.log${NC}"
    FRONTEND_URL="http://localhost:$FRONTEND_PORT"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Everything is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services:"
echo "   Backend:  http://localhost:8080"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop everything:"
echo "   pkill -f 'spring-boot:run'"
echo "   pkill -f 'vite'"
echo "   docker compose down"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
