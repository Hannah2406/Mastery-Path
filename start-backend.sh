#!/bin/bash

echo "🚀 Starting MasteryPath Backend..."
echo ""

# Check if database is running
echo "Checking database connection..."
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL container not running!"
    echo "Starting database with: docker compose up -d"
    docker compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Start backend
echo ""
echo "Starting Spring Boot backend..."
cd backend
mvn spring-boot:run -DskipTests
