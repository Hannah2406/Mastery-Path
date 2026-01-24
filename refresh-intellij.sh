#!/bin/bash

echo "🔄 Refreshing IntelliJ IDEA project..."
echo ""

cd backend

echo "1. Cleaning Maven project..."
mvn clean

echo ""
echo "2. Compiling (this will help IntelliJ recognize the project structure)..."
mvn compile -DskipTests

echo ""
echo "3. Generating sources..."
mvn generate-sources

echo ""
echo "✅ Done! Now in IntelliJ IDEA:"
echo "   - Right-click on 'backend' folder → Maven → Reload Project"
echo "   - File → Invalidate Caches → Invalidate and Restart"
echo ""
echo "This will fix the red errors in IntelliJ!"
