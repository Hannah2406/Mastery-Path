# Generate Path with AI — Technical Overview

This document explains how **Generate path with AI** works end-to-end: from the user typing a topic (e.g. "calculus grade 12" or "AMC 10 competition") to a full learning path with units, prerequisites (including same-level/branching), and AI-generated practice questions per node—with no external links, just in-app practice.

---

## 1. High-Level Flow

```
User enters topic in modal
        ↓
Frontend: POST /api/v1/ai/generate-path  (description, difficulty, estimatedTime)
        ↓
Backend: AIService.generatePath() → calls Gemini/OpenAI with a structured prompt
        ↓
AI returns JSON array of units (name, description, category, prerequisites)
        ↓
Backend parses response (case-insensitive, flexible keys), returns suggestions to frontend
        ↓
User clicks "Create Path"
        ↓
Frontend: POST /api/v1/paths/from-ai  (name, description, suggestions with prerequisites)
        ↓
Backend: PathService.createPathFromAISuggestions()
  • Creates path, find-or-create Category + Node per suggestion
  • Builds prerequisite edges from each unit’s "prerequisites" array (DAG; same-level possible)
  • For each node: AIService.generateQuestions() → save as Problem records (5 per node)
        ↓
Path appears in the tree with nodes, unlock order, and practice questions ready
```

So **one user action** (“Generate path” then “Create path”) produces:
- A path with 8–12 curriculum-style units
- A **DAG** of prerequisites (not just a straight line: some units can be same-level)
- **No external links** on nodes; practice is generated from the topic
- **AI-generated practice questions** for each unit, saved to the DB so they load like Blind 75 / AMC 8

---

## 2. Key Components

### 2.1 Frontend

| Piece | Role |
|-------|------|
| **GenerateWithAIModal.jsx** | User enters topic/difficulty; calls `generatePath()` to get suggestions; displays list (with “After: unit(s) …” when prerequisites exist); on “Create Path” calls `createPathFromAI()` with suggestions (including `prerequisites`). No resource link shown. |
| **api/ai.js** | `generatePath(description, difficulty, estimatedTime)` → `POST /api/v1/ai/generate-path`, returns `{ suggestions }`. |
| **api/paths.js** | `createPathFromAI({ name, description, suggestions })` → `POST /api/v1/paths/from-ai`. |
| **PracticeSession.jsx** | Loads problems via `getProblemsForNode(nodeId)`. For AI-generated paths, those problems were created at path-creation time, so they just load from DB. |

### 2.2 Backend — AI Layer

| Piece | Role |
|-------|------|
| **AIController** | `POST /generate-path`: checks `isAiConfigured()` (returns 503 if no key); calls `AIService.generatePath()`; maps result to `GeneratePathResponse` (suggestions with `name`, `description`, `category`, `prerequisites`). |
| **AIService.generatePath()** | Builds prompt via `buildPathGenerationPrompt()`, calls `callAi(prompt, 8192)` (Gemini or OpenAI), parses with `parsePathResponse()`, throws if no nodes (so UI can show a clear error). |
| **buildPathGenerationPrompt()** | Tells the model: accept any topic; 8–12 units; **no external links**; use a **prerequisites** array (0-based indices) so some units can be same-level (e.g. both depend only on unit 0) and later units can depend on multiple (e.g. [1, 2]). Example in prompt: linear chain vs branching. |
| **parsePathResponse()** | Extracts JSON array (strips markdown if present); for each element reads `name` / `title` / `unit`, `description` / `desc`, `category` / `subject`, and **prerequisites** (or infers linear: unit i depends on i−1). Uses case-insensitive key lookup. |
| **extractJsonArray()** | Finds first `[` to last `]`; if that fails, tries parsing whole response as object and looks for array under keys like `path`, `units`, `nodes`, `suggestions`. Handles truncated JSON by appending `]` when needed. |

So the **AI contract** is: return a JSON array of objects with at least `name`, and optionally `description`, `category`, and **prerequisites** (array of 0-based indices). The backend tolerates different key names/casing and missing fields.

### 2.3 Backend — Path Creation and Problems

| Piece | Role |
|-------|------|
| **PathController** | `POST /paths/from-ai`: auth; forwards to `PathService.createPathFromAISuggestions()`. |
| **PathService.createPathFromAISuggestions()** | 1) Creates path (name, description). 2) For each suggestion: find-or-create Category by name, find-or-create Node (name, description, **externalUrl = null**). 3) Saves PathNodes in order. 4) **Prerequisites**: for each index i, if suggestion has `prerequisites` list, adds edge (nodeIds[j], nodeIds[i]) for each j in list (with dedupe); else linear (i−1 → i). 5) If AI configured: for each node, `AIService.generateQuestions(topic, difficulty, 5, pathName)` and saves each as a `Problem` for that node. |
| **Node / Problem** | Nodes for AI path are created with **no external URL**; practice is only the generated `Problem` rows. |

So:
- **Same-level / branching:** Driven entirely by the **prerequisites** array per unit (and the prompt asking the model to use it). No extra “link” or “level” field.
- **No per-node link:** We never set `externalUrl` on nodes created from AI suggestions; the prompt also says not to include external links.
- **Questions per topic:** Same `generateQuestions()` used elsewhere (AMC 8 style when path name suggests competition/math, else general). Questions are created and saved once at path creation so they’re ready when the user opens a node.

---

## 3. How Same-Level / Branching Works

- Each suggestion can have **prerequisites: number[]** (0-based indices of units that must be completed first).
- Examples:
  - Unit 0: `prerequisites: []` → no prereqs (entry).
  - Units 1 and 2: both `prerequisites: [0]` → same level; either can be done after 0.
  - Unit 3: `prerequisites: [1, 2]` → depends on both 1 and 2.
- Backend builds **NodePrerequisite** rows: for each (prereqIndex, currentIndex) we add an edge `(nodeIds[prereqIndex], nodeIds[currentIndex])`. Duplicate edges are skipped (Set of "prereqId,dependentId").
- The existing **tree/unlock logic** (UnlockEngine, SkillTree) already works on a generic DAG of NodePrerequisite; it doesn’t assume a linear chain. So same-level and branching “just work” once the right edges exist.

---

## 4. How Questions Are Generated for Each Topic

- In **PathService.createPathFromAISuggestions()**, after creating path and nodes and prerequisites:
  - For each node id in order: load Node, build **topic** = `node.getName() + " " + node.getDescription()`.
  - Call **AIService.generateQuestions(topic, difficulty, 5, path.getName())**.
  - **Difficulty** is `"hard"` if path name matches something like AMC/competition/math, else `"intermediate"`.
  - **pathName** is passed so the AI can use AMC 8–style prompts when appropriate.
  - Each returned question is saved as a **Problem** (nodeId, problemText, solutionText, difficulty).
- So when the user opens a node, **getProblemsForNode(nodeId)** returns those saved problems—same flow as Blind 75 / AMC 8, but the content is tailored to the generated path topic and unit.

---

## 5. Error Handling and Robustness

- **No API key:** `isAiConfigured()` is false → 503 with message to add `GEMINI_API_KEY` or `OPENAI_API_KEY` and restart.
- **AI returns no nodes / parse failure:** `generatePath()` throws; controller returns 500 with that message so the UI can show it instead of a generic “no nodes.”
- **Empty suggestions in UI:** If the backend returns 200 with empty list, the modal shows a short “No nodes were generated…” message (no mention of API key there).
- **Path creation with AI failure:** If question generation for a node throws, we catch and skip that node (path and other nodes still created).
- **Duplicate prerequisites:** Edges are deduped before save so we never violate the composite primary key on `node_prerequisite`.

---

## 6. File Reference (Quick Lookup)

| Layer | File | Responsibility |
|-------|------|----------------|
| Frontend | `GenerateWithAIModal.jsx` | Topic input, generate, display suggestions, create path with prerequisites |
| Frontend | `api/ai.js` | `generatePath()` |
| Frontend | `api/paths.js` | `createPathFromAI()` |
| Backend | `AIController.java` | `/generate-path`: 503 if no key, else generate and return suggestions |
| Backend | `AIService.java` | Prompt, `callAi`, `parsePathResponse`, `extractJsonArray`, `getPrerequisitesFromNode`, `generateQuestions` |
| Backend | `PathController.java` | `/from-ai`: create path from suggestions |
| Backend | `PathService.java` | `createPathFromAISuggestions`: path, nodes, prereq DAG, per-node question generation |
| Backend | `CreatePathFromAIRequest.java` | DTO: name, description, suggestions (each with name, description, category, prerequisites) |
| Backend | `GeneratePathResponse.java` | DTO: suggestions (name, description, category, resourceUrl, prerequisites) |

---

## 7. Summary

- **One flow:** Generate (AI → suggestions with prerequisites) → Create path (path + nodes + DAG + problems).
- **Same-level / branching:** Model returns a **prerequisites** array per unit; backend turns that into a DAG of `NodePrerequisite` edges; existing unlock logic uses that DAG.
- **No external links:** Nodes are created with `externalUrl = null`; prompt tells the model not to include links; practice is only the generated problems.
- **Questions per topic:** For each node, we call the same AI question generator used elsewhere, then persist results as `Problem` rows so each node has its own practice set, like Blind 75 / AMC 8 but for the user’s chosen topic.

That’s how “Generate path with AI” is implemented end-to-end.
