#!/bin/bash
# Dev reset: drop Postgres volume, bring DB back up. Next backend start runs Flyway (migrations + seed).

set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Dev reset: dropping DB volume and restarting Postgres...${NC}"
cd "$(dirname "$0")"

# Stop backend so it releases DB connections
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "MasteryPathApplication" 2>/dev/null || true
sleep 2

docker compose down -v
docker compose up -d

echo "Waiting for Postgres to be ready..."
for i in {1..30}; do
  if docker exec masterypath-db pg_isready -U masterypath -d masterypath 2>/dev/null; then
    echo -e "${GREEN}Postgres is ready.${NC}"
    echo ""
    echo "Run ./start-all.sh to start backend (Flyway will run migrations + seed) and frontend."
    exit 0
  fi
  sleep 1
done
echo "Postgres failed to become ready."
exit 1
