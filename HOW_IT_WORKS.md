# 🎓 How MasteryPath Works

## 📐 Overall Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │◄────►│   Backend    │◄────►│  PostgreSQL  │
│  (React)    │      │ (Spring Boot)│      │   Database   │
│  Port 5173  │      │  Port 8080   │      │  Port 5433   │
└─────────────┘      └──────────────┘      └─────────────┘
```

## 🔄 User Flow

### 1. **Authentication**
- User registers/logs in → Session created
- Session stored in browser cookies
- Backend validates session on each request

### 2. **Path Selection**
- User chooses a learning path (Blind 75 or AMC8)
- Backend loads all nodes (skills/problems) for that path
- Skill tree displays showing available/locked/mastered skills

### 3. **Skill Tree (DAG - Directed Acyclic Graph)**
- **Nodes** = Skills/Problems (e.g., "Two Sum", "Basic Arithmetic")
- **Edges** = Prerequisites (e.g., "Two Sum" must be mastered before "3Sum")
- **Status Colors**:
  - 🔒 **LOCKED** (gray) - Prerequisites not met
  - 🔵 **AVAILABLE** (blue) - Can practice now
  - 🟡 **DECAYING** (yellow) - Was mastered but needs review
  - 🟢 **MASTERED** (green) - Score ≥ 80%

### 4. **Practice Session**
When you click "Start Practice" on a skill:

**For AMC8 (Math Problems):**
1. Fetches multiple problems from database for that topic
2. Shows problems one at a time
3. You can show/hide solutions
4. After each problem, mark as solved or not solved
5. Automatically moves to next problem

**For Blind 75 (Coding Problems):**
1. Shows LeetCode link to practice on LeetCode
2. When done, mark as solved or not solved
3. Can also have database problems (if added)

### 5. **Mastery System**

When you complete a practice session:

**Mastery Score Calculation:**
- ✅ **Solved correctly**: +15% to mastery score
- ❌ **Execution error** (typo): -5%
- ❌ **Forgot approach**: -15%
- ❌ **Concept gap**: -25%

**Status Updates:**
- Score ≥ 80% → **MASTERED** 🟢
- Was MASTERED but score < 80% → **DECAYING** 🟡
- First time practicing → **AVAILABLE** 🔵

**Unlocking:**
- When you master a skill, it unlocks dependent skills
- Example: Master "Two Sum" → Unlocks "3Sum", "Contains Duplicate"

### 6. **Decay System**
- Skills decay over time if not practiced
- Each category has a decay rate
- After grace period, mastery score decreases
- Prevents skills from being "forgotten"

### 7. **Heatmap & Statistics**
- **Heatmap**: Shows practice frequency (like GitHub contributions)
  - Each square = one day
  - Darker green = more practices that day
  - Shows last 53 weeks
  
- **Statistics**:
  - Total practices
  - Current streak (consecutive days)
  - Longest streak

## 🗄️ Database Structure

### Core Tables:
1. **users** - User accounts
2. **category** - Problem categories (Array, Algebra, etc.)
3. **node** - Skills/problems (e.g., "Two Sum", "Basic Arithmetic")
4. **path** - Learning paths (Blind 75, AMC8)
5. **path_node** - Which nodes belong to which paths
6. **node_prerequisite** - Skill dependencies (DAG edges)
7. **user_skill** - Your progress on each skill
   - `mastery_score` (0.0 to 1.0)
   - `node_status` (LOCKED/AVAILABLE/DECAYING/MASTERED)
8. **performance_log** - Every practice attempt (immutable history)
9. **problem** - Multiple practice problems per node (NEW!)

## 💻 Technology Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- ReactFlow (for skill tree visualization)

**Backend:**
- Spring Boot (Java)
- Spring Security (authentication)
- Spring Data JPA (database)
- Flyway (database migrations)

**Database:**
- PostgreSQL (Docker container)

## 🔑 Key Components

### NodeResponse.java (What you're looking at)
- DTO (Data Transfer Object) that sends skill data to frontend
- Contains: id, name, description, category, status, mastery score
- Used to display skills in the skill tree

### MasteryService.java
- Calculates mastery scores
- Updates skill status
- Handles unlocking logic

### PracticeSession.jsx
- Shows problems to practice
- Tracks time spent
- Submits results to backend

### ContributionHeatmap.jsx
- Displays GitHub-style activity calendar
- Shows practice frequency over time
- Calculates streaks

## 🎯 Example Flow

1. **User logs in** → Session created
2. **Selects "AMC8" path** → Backend returns 59 skills
3. **Clicks "Basic Arithmetic"** → Opens practice session
4. **Backend fetches problems** → Returns 5 problems for that topic
5. **User practices** → Works through problems one by one
6. **Marks each as solved/not solved** → Backend logs each attempt
7. **After all problems** → Mastery score updated
8. **If score ≥ 80%** → Skill becomes MASTERED, unlocks new skills
9. **Heatmap updates** → Shows today's practice

## 📊 Data Flow

```
User Action → Frontend → API Call → Backend Controller
                                    ↓
                              Service Layer
                                    ↓
                              Repository (Database)
                                    ↓
                              Response → Frontend → UI Update
```

## 🔐 Security

- Session-based authentication
- Passwords hashed with BCrypt
- CORS configured for frontend ports
- Controllers validate sessions manually

## 🚀 Starting the Application

1. **Database**: `docker compose up -d`
2. **Backend**: `cd backend && mvn spring-boot:run`
3. **Frontend**: `cd frontend && npm run dev`

Or use: `./start-all.sh` (does everything!)
