#!/bin/bash

echo "🛑 Stopping MasteryPath..."

# Stop backend
echo "Stopping backend..."
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "MasteryPathApplication" 2>/dev/null

# Stop frontend
echo "Stopping frontend..."
pkill -f "vite" 2>/dev/null

# Stop database
echo "Stopping database..."
cd "$(dirname "$0")"
docker compose down 2>/dev/null

echo "✅ Everything stopped!"
