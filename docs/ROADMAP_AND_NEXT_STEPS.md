# Mastery Path — Roadmap & Next Steps

This doc ties together: **Generate Homework**, **Generate Paths**, **Difficulty**, **Topics**, **Path for Success**, **Prototype Fixes**, **Go to Market (AWS)**, and **Next Steps**.

---

## 1. GENERATE HOMEWORK FEATURE

**Status: Implemented.** You already have:

- **Get homework**: Topic + difficulty → AI generates questions; optional PDF download.
- **Generate homework PDF**: Per-node (e.g. from Practice) or from FileUploadModal; uses path name so AMC8 gets competition-style questions.
- **Mark homework**: Upload PDF/image → AI scores and gives feedback.

**Possible enhancements:**

- **Path-aware topics**: When generating from a path, prefill or restrict topics to the path’s node names (so “Generate homework” is clearly scoped to the current path).
- **Save generated sets**: Option to save an AI-generated question set as node problems (so they persist and appear in practice without re-generating).
- **Homework history**: List of generated/marked homework with links to PDFs or results.

---

## 2. MAKE GENERATE PATHS WORK

**Current bug:** “Create Path” in the AI Generate Path flow only creates an **empty** path. The AI returns a list of node suggestions (name, description, category), but the frontend only calls `createPath({ name, description })` and never sends the suggestions to the backend, so no nodes are created.

**Fix (implemented):**

- **Backend**: `POST /api/v1/paths/from-ai` with `{ name, description, suggestions: [{ name, description, category }] }`. `PathService.createPathFromAISuggestions()` find-or-creates Category and Node for each suggestion, then creates PathNodes in order.
- **Frontend**: `createPathFromAI()` in `api/paths.js`; `GenerateWithAIModal` calls it with the AI suggestions when user clicks “Create Path”.

**Result:** User gets a path with 8–15 nodes in order, ready to practice.

---

## 3. PROPER DIFFICULTY

**Current state:**

- **Paths**: Difficulty is `beginner` / `intermediate` / `advanced` (path-level and in generate-path).
- **Questions**: 1–5 scale in DB and AI (easy → hardest); UI shows star rating.
- **Homework generation**: Easy / intermediate / hard; AMC8 path uses a dedicated “hard” prompt.

**Improvements:**

- **Consistency**: Use one vocabulary everywhere (e.g. “beginner/intermediate/advanced” for paths and “1–5” for problems), with clear mapping in prompts and UI.
- **Path default**: When opening practice or “Generate homework”, default difficulty from path (e.g. AMC8 → hard).
- **Calibration**: Optional “placement” or “diagnostic” that suggests a starting difficulty from a few questions (future).

---

## 4. PROPER TOPICS

**Current state:**

- Topics are **free text** (e.g. “Algebra”, “Two Sum”, “Fractions”).
- Path nodes have **names** that act as topics when generating questions or homework.
- **Categories** exist in the DB (e.g. Array, Algebra); AI path suggestions include `category`.

**Improvements:**

- **Path-derived topics**: In practice/homework UI, offer a dropdown or chips of the **current path’s node names** as topics so generation is clearly aligned to the path.
- **Taxonomy (optional)**: Curated list of topics per path type (e.g. AMC8: Arithmetic, Number Theory, Geometry, …) so AI and filters stay consistent.
- **Predefined + custom**: Allow “from path nodes” plus “Other: …” for ad-hoc topics.

---

## 5. CATERED TO A PATH FOR SUCCESS

**Already in place:**

- **Path generation prompt** uses description, difficulty, and estimated time; asks for 8–15 skills in logical order (basics first).
- **Question generation** can be path-aware (e.g. AMC8 path → competition-style questions).

**With “Make Generate Paths Work” fixed:**

- The generated path will actually contain the suggested nodes, so the path is a real learning sequence, not an empty shell.

**Further improvements:**

- **Prerequisites**: When creating nodes from AI suggestions, optionally create prerequisite edges (e.g. “Core Concepts” before “Advanced Practice”) so the tree and “path for success” are explicit.
- **Prompt tweaks**: In `buildPathGenerationPrompt`, add one line: “Order so each step builds on the previous; no circular dependencies.”
- **Success criteria**: Per-node or per-path “mastery” definition (e.g. N problems correct at difficulty X) and show progress toward that.

---

## 6. FIX PROBLEMS WITH CURRENT PROTOTYPE

**Known issues and fixes:**

| Issue | Where | Fix |
|-------|--------|-----|
| **Generate path creates empty path** | `GenerateWithAIModal` + PathController | Use new “create path from AI” API with suggestions (see §2). |
| **Git commit “unknown option trailer”** | Local git wrapper | Use `/usr/bin/git commit` or fix the wrapper that injects `--trailer`. |
| **AI 429 / quota** | Gemini/OpenAI | Handled with friendly messages; consider retry-with-backoff or optional secondary key. |
| **Piston 401** | Code execution | Backend already falls back to AI code review when execution fails. |
| **Two Sum test 4** | AIService built-in data | Expected indices for `target=10` fixed to `[2,3]` for `nums=[1,5,3,7,2]`. |

**Other checks:**

- Run full flow: sign up → create path (or generate with AI) → open node → practice / generate homework / mark homework → review.
- Ensure all env vars (e.g. `GEMINI_API_KEY` or `OPENAI_API_KEY`) are documented in `.env.example` and `docs/AI_SETUP.md`.

---

## 7. GO TO MARKET — DEPLOY TO AWS

**Goal:** Run Mastery Path in production on AWS so others can use it.

**High-level steps:**

1. **Learn AWS basics** (if new):
   - **Compute**: EC2 (single server) or **App Runner** / **ECS** (containers), or **Elastic Beanstalk** (platform that handles scaling and load balancer).
   - **Database**: **RDS** (PostgreSQL or MySQL) — your app already uses a DB; point `application.yml` to RDS URL.
   - **Frontend**: Build React app (`npm run build`), serve via **S3 + CloudFront** (static site) or same server as backend (e.g. Spring serving static files).

2. **Prepare the app:**
   - **Backend**: Use `application-prod.yml` (or env vars) for `spring.datasource.url`, etc.; never commit real passwords (use **Secrets Manager** or env vars).
   - **Frontend**: Set API base URL to your backend URL (e.g. `https://api.yourdomain.com` or EC2/App Runner URL).
   - **CORS**: Allow your frontend origin in backend config.

3. **Deploy options:**
   - **Simple**: One **EC2** instance; install Java, run `java -jar backend.jar`; run React build behind Nginx or serve from Spring; use **RDS** for DB.
   - **Containers**: Dockerize backend (and optionally frontend); run on **ECS** or **App Runner**; RDS for DB; **ALB** for HTTPS.
   - **Guides**: Search “deploy Spring Boot to AWS” and “deploy React S3 CloudFront” for step-by-step tutorials.

4. **Domain & HTTPS:** Use **Route 53** for DNS; **ACM** for SSL certs; put **CloudFront** or **ALB** in front so the app is served over HTTPS.

5. **CI/CD (optional):** **GitHub Actions** to run tests and deploy to AWS (e.g. build JAR, push to S3/ECR, update ECS or EC2).

**Suggested order:** Get one EC2 + RDS + Nginx (or Spring static) working; then add CloudFront/HTTPS and CI/CD.

---

## 8. NEXT STEPS (PRIORITIZED)

1. **Make Generate Paths work** — Implement “create path from AI” (backend + frontend) so generated suggestions become real path nodes. *(Done in codebase; see §2.)*
2. **Smoke-test full flow** — Sign up, generate path with AI, create path, open nodes, generate homework, run practice, mark homework.
3. **Path-aware topics** — In homework/practice, default or suggest topics from current path’s node names.
4. **Difficulty consistency** — Default practice/homework difficulty from path; document 1–5 vs beginner/intermediate/advanced mapping.
5. **Deploy to AWS** — Follow §7: pick EC2 or App Runner, set up RDS, deploy backend and frontend, add HTTPS.
6. **Optional**: Save generated question sets as node problems; prerequisites in AI-generated paths; placement/difficulty calibration.

Use this doc as the single reference for **Generate Homework**, **Generate Paths**, **Difficulty**, **Topics**, **Path for Success**, **Prototype Fixes**, **Go to Market**, and **Next Steps**.
