#!/usr/bin/env bash
# Connect to MasteryPath PostgreSQL database.
# Usage: ./scripts/connect-db.sh
# Requires: Docker container running (docker compose up -d) and psql installed,
#           OR run: docker exec -it masterypath-db psql -U masterypath -d masterypath

set -e
cd "$(dirname "$0")/.."

if command -v psql &>/dev/null; then
  echo "Connecting to masterypath@localhost:5433/masterypath ..."
  PGPASSWORD=masterypath psql -h localhost -p 5433 -U masterypath -d masterypath "$@"
else
  echo "psql not found. Using Docker exec to connect..."
  if docker ps --format '{{.Names}}' | grep -q masterypath-db; then
    docker exec -it masterypath-db psql -U masterypath -d masterypath "$@"
  else
    echo "Error: Start the database first with: docker compose up -d"
    exit 1
  fi
fi
