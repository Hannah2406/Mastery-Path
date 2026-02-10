# Next Steps for the Week

This doc suggests **concrete steps for the next ~7 days** given what’s done and a typical product vision (retention, onboarding, content, quality). Adjust to match your own vision doc.

---

## What’s Done So Far (Baseline)

| Area | Done |
|------|------|
| **Auth** | Register, login, logout, session, profile |
| **Paths** | Choose path, skill tree (Map), create path from scratch, “Generate with AI” (placeholder) |
| **Practice** | Start practice, Success/Fail + error type, log attempt, result screen, CTAs (Retry, Next recommended, Back to map), force log on fail |
| **Mastery** | Node status (Locked / Available / Decaying / Mastered), unlock by prerequisites, locked nodes can’t practice or follow links |
| **Review** | Review tab, queue endpoint, “Start Review” from queue |
| **Analytics** | Analytics tab, heatmap, mistake breakdown, top leaks, mastery health |
| **Today stats** | Sidebar: Review Due, Streak, Mastered % from real APIs |
| **Marketplace** | Browse, filters (price/difficulty/tag/sort), search, preview tree, Get Free / Checkout / Import, purchase flow, “Make your own” + Publish, mock seed data |
| **Database** | Postgres (Docker) + H2, Flyway migrations, marketplace + purchase tables |
| **Docs** | DATABASE.md, TECHNICAL_MASTER_GUIDE.md, ARCHITECTURE.md, MARKETPLACE_EXAMPLE_DATA.md |

---

## Focus for This Week (Pick 2–3)

Pick **2–3** of the areas below so the week stays focused. Each is ~1–2 days of work.

---

### 1. Retention: Streak & Reminders (High impact)

**Goal:** Make “come back tomorrow” feel real and visible.

- [ ] **Streak rules**  
  - Backend: define “streak” clearly (e.g. at least one successful practice per calendar day).  
  - Implement or adjust in `HistoryController` / heatmap logic so `currentStreak` and `longestStreak` match that definition.  
  - Frontend: show streak in sidebar and in profile/heatmap; optional “Don’t break your streak” copy.
- [ ] **Simple “reminder”**  
  - E.g. “You have X due for review” in sidebar or a small banner when `reviewDueCount > 0`.  
  - No email needed for this week; just in-app.

**Where:** `backend` heatmap/stats, `frontend` sidebar + `ContributionHeatmap` / profile.

---

### 2. Onboarding: First-Time Experience (High impact)

**Goal:** New users know what to do in the first 2 minutes.

- [ ] **First-time hint**  
  - After login, if user has never started a practice (e.g. no `performance_log` rows), show a short tooltip or modal: “Pick a path → open a node → Start Practice.”
- [ ] **Empty state copy**  
  - When Review queue is empty: “Nothing due. Practice on the Map to add skills to your review queue.”  
  - When no paths selected: keep current “Choose your path” + “Make your own” + “Browse Marketplace” clear.

**Where:** `App.jsx` or a small `OnboardingHint.jsx`; `ReviewQueue.jsx` empty state.

---

### 3. Content: Add Problems or Paths (Medium impact)

**Goal:** More to practice without changing architecture.

- [ ] **More problems per node**  
  - Add another Flyway migration (e.g. `V9__more_problems.sql`) that inserts extra `problem` rows for existing nodes (Blind 75, AMC8).  
  - Practice session already picks from `problems`; more rows = more variety.
- [ ] **One new path (optional)**  
  - e.g. “System design basics” or “Interview patterns”: new `path` + `path_node` + optional `node` rows in a migration.  
  - Lets you test “create path from scratch” vs “predefined path” and marketplace import.

**Where:** `backend/src/main/resources/db/migration/`, `problem` and `path` / `path_node` / `node` tables.

---

### 4. Quality: Errors & Loading (Medium impact)

**Goal:** Fewer silent failures and a more solid feel.

- [ ] **API error handling**  
  - Ensure every `fetch` in `frontend/src/api/*.js` handles non‑JSON (e.g. 502/504) and shows a short message (“Something went wrong. Retry?”).  
  - Optional: one small `useApi` hook or helper that does try/catch + toast/message.
- [ ] **Loading states**  
  - Any list or tree that fetches data should show a skeleton or spinner until the first response.  
  - Check: Marketplace, Review queue, Analytics, Path selector.

**Where:** `frontend/src/api/`, and each component that calls APIs.

---

### 5. Marketplace: Discovery & Trust (Optional)

**Goal:** Marketplace feels alive and trustworthy.

- [ ] **“Featured” or “Popular”**  
  - Backend: e.g. `GET /api/v1/marketplace/featured?limit=5` (e.g. most imported or newest).  
  - Frontend: small “Featured” or “Popular” section at top of Marketplace.
- [ ] **Author name**  
  - You already have `authorEmail`; consider showing a short “By author@email.com” or “By Demo User” on cards so it’s clear who published.

**Where:** `MarketplaceController`, `MarketplaceService`, `MarketplaceBrowser.jsx`.

---

### 6. Technical Hygiene (Low effort, high long-term value)

**Goal:** Easier to work in the repo and onboard others.

- [ ] **README**  
  - Single “How to run” (e.g. `./start-all.sh` or “Docker + backend + frontend” in 3 steps).  
  - Link to `docs/TECHNICAL_MASTER_GUIDE.md` and `docs/DATABASE.md`.
- [ ] **.env.example (optional)**  
  - If you add env vars later (e.g. API base URL), list them in `.env.example` with placeholders.
- [ ] **One smoke test**  
  - e.g. “Register → Login → Load tree → Start practice → Log success” once manually or with a simple Playwright/Cypress script so you know the happy path still works after changes.

**Where:** Repo root README, `docs/`, optional `e2e/` or `tests/`.

---

### 7. Align With Your Vision Doc (You choose)

**Goal:** Map this week to *your* doc (PRD/FRD/TDD or “Master Plan”).

- [ ] **Re-read your vision doc**  
  - List 3–5 “must have soon” items that aren’t done yet.
- [ ] **Map to tasks**  
  - For each, write 1–3 concrete tasks (e.g. “Add streak definition to backend,” “Show onboarding hint when no practices”).  
  - Merge with the focus areas above so this week moves the needle on your vision.

---

## Suggested Week Plan (Example)

| Day | Focus | Tasks |
|-----|--------|--------|
| **Mon–Tue** | Retention + Onboarding | Streak definition + in-app “X due for review”; first-time hint or empty-state copy. |
| **Wed** | Content or Quality | Either: one migration with more problems (or one new path). Or: API error handling + one loading pass. |
| **Thu** | Quality or Marketplace | Finish loading/errors, or add “Featured” + author on marketplace cards. |
| **Fri** | Hygiene + Vision | Update README and TECHNICAL_MASTER_GUIDE if needed; re-read vision doc and write next week’s 3 priorities. |

---

## How to Use This Doc

- **This week:** Pick 2–3 focus areas and check off tasks as you go.
- **Next week:** Copy the “What’s done” section, add what you shipped, then write a new “Focus for this week” from your vision doc and from what users need most (e.g. mobile, performance, more paths).
- **Vision doc:** If your doc lives in the repo (e.g. `docs/VISION.md` or `Master_Plan/`), add a line here: “Vision: see docs/VISION.md” and keep next steps aligned with it.

You’re in a good place: core loop (practice → mastery → review) and marketplace MVP are in. This week is about **retention, clarity, and a bit of content or polish** so the app feels more complete and easier to improve next.
