#!/usr/bin/env bash
# Run SQL against MasteryPath database.
# Usage:
#   ./scripts/run-sql.sh                    # run queries in scripts/sample-queries.sql
#   ./scripts/run-sql.sh "SELECT 1"         # run one query
#   ./scripts/run-sql.sh -f myfile.sql     # run SQL from file
#
# Requires: Docker container running (docker compose up -d)

set -e
cd "$(dirname "$0")/.."

run_psql() {
  if command -v psql &>/dev/null; then
    PGPASSWORD=masterypath psql -h localhost -p 5433 -U masterypath -d masterypath "$@"
  elif docker ps --format '{{.Names}}' | grep -q masterypath-db; then
    docker exec -i masterypath-db psql -U masterypath -d masterypath "$@"
  else
    echo "Error: Start the database first: docker compose up -d"
    exit 1
  fi
}

if [ $# -eq 0 ]; then
  run_psql -f "$(dirname "$0")/sample-queries.sql"
else
  run_psql "$@"
fi
