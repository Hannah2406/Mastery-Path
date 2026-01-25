# 🔧 Fix Docker Desktop Issues

## Problem: "Docker Desktop is unable to start"

This usually happens when the Docker daemon gets stuck or corrupted.

## Quick Fixes (Try in order):

### 1. **Restart Docker Desktop Completely**
```bash
# Quit Docker Desktop completely
killall Docker

# Wait 5 seconds, then restart
open -a Docker

# Wait 30-60 seconds for it to fully start
```

### 2. **Reset Docker Desktop**
1. Open Docker Desktop
2. Click the **Settings** (gear icon) in the top right
3. Go to **Troubleshoot**
4. Click **"Clean / Purge data"** or **"Reset to factory defaults"**
5. Restart Docker Desktop

### 3. **Restart Your Mac**
Sometimes Docker needs a full system restart to fix daemon issues.

### 4. **Check Docker Resources**
1. Open Docker Desktop
2. Go to **Settings** → **Resources**
3. Make sure you have enough:
   - **Memory**: At least 2GB allocated
   - **Disk**: At least 20GB available
   - **CPU**: At least 2 cores

### 5. **Reinstall Docker Desktop** (Last Resort)
1. Uninstall Docker Desktop:
   ```bash
   rm -rf ~/Library/Containers/com.docker.docker
   rm -rf ~/Library/Application\ Support/Docker\ Desktop
   ```
2. Download and reinstall from: https://www.docker.com/products/docker-desktop/

## Alternative: Use PostgreSQL Without Docker

If Docker keeps having issues, you can install PostgreSQL directly:

```bash
# Install PostgreSQL with Homebrew
brew install postgresql@16

# Start PostgreSQL
brew services start postgresql@16

# Create database
createdb masterypath

# Update application.yml to use:
# url: jdbc:postgresql://localhost:5432/masterypath
```

## Check if Docker is Working

After trying the fixes above, test with:
```bash
docker ps
```

If this works without errors, Docker is fixed!
