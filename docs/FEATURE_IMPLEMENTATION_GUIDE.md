# Feature Implementation Guide

This document explains **how each major feature was implemented**: where it lives in the codebase, how it works, and the main coding decisions.

---

## 1. HAVE A PLACE TO CODE IN APP

### What it does
Users can write and run code **inside the app** for coding nodes (e.g. LeetCode-style problems like Two Sum). No need to leave for an external editor. The app provides:
- A **code editor** with templates (Python, JavaScript, Java), auto-indent, auto-closing brackets, Tab = 4 spaces
- **Run tests** against AI-generated test cases (or Piston execution)
- **AI code review** when tests fail or when the execution service is unavailable
- **Two Sum tip**: reminder to return *indices* (e.g. `i`, `j`), not values

### How it works (flow)
1. User selects a **coding node** on the path (e.g. “Two Sum”). Practice session loads.
2. **Code editor** is shown with a language dropdown and a template (no `return` in the stub).
3. User writes code and clicks **Run tests**. Frontend calls `POST /api/v1/ai/check-code` with `problemStatement`, `code`, `language`.
4. Backend **generates test cases** (if needed), runs code via **Piston** (CodeExecutionService), compares output to expected. If Piston returns 401/403, backend still requests **AI code review** and returns that so the UI can show “tests couldn’t run” + feedback.
5. UI shows: passed/failed counts, per-test results, and **AI feedback** (hints, not full solution).

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Frontend – editor** | `frontend/src/components/Practice/CodeEditor.jsx` | Reusable `<textarea>` with `onKeyDown`: Enter → copy current line indent; `{`, `(`, `[` → insert closing char and place cursor between; Tab → 4 spaces. Uses `pendingCursorRef` to restore cursor after value updates. |
| **Frontend – practice** | `frontend/src/components/Practice/PracticeSession.jsx` | Detects coding nodes (e.g. by `externalUrl` or type). Renders `CodeEditor`, language select, “Run tests” and “Open on LeetCode”. Calls `checkCode(problemStmt, codeEditorValue, codeLanguage, null)`. Shows `codeCheckResult` (passed/failed, results, `aiFeedback`). Two Sum tip: `nodeName.toLowerCase().includes('two sum')` → show “return indices” tip. |
| **Frontend – API** | `frontend/src/api/ai.js` | `checkCode(problemStatement, code, language, testCases)` → `POST /api/v1/ai/check-code` with JSON body. Uses `friendlyAiError()` for 401/503. |
| **Backend – API** | `backend/.../api/ai/AIController.java` | `@PostMapping("/check-code")` → `aiService.checkCode(...)` → returns `CheckCodeResponse` (passed, failed, total, results, aiFeedback). |
| **Backend – execution** | `backend/.../domain/service/CodeExecutionService.java` | Sends code + language + stdin to Piston `execute` API. Maps language (python, javascript, java). On 401/403 returns friendly message; no exception so caller can still ask for AI feedback. |
| **Backend – AI** | `backend/.../domain/service/AIService.java` | `checkCode()`: generates test cases if null, runs each via CodeExecutionService, builds results. If all failures are execution/401/Piston errors, calls `getCodeReviewWhenExecutionFails()` so UI still gets AI feedback. |
| **Templates** | `PracticeSession.jsx` | `getCodeEditorTemplate(lang)` returns Python/Java/JS skeletons (e.g. `class Solution:` / `twoSum(self, nums, target)` with “Your code here”, no `return` in stub). |

### Key implementation details
- **CodeEditor** is a controlled component: `value` / `onChange` from parent. All special keys (Tab, Enter, `{`, `(`, `[`) are handled in `handleKeyDown` with `e.preventDefault()` and a single `onChange(newValue)`; cursor position is restored in a `useEffect` after the state update.
- **Java** is supported in the template and in `CodeExecutionService.toPistonLanguage("java")`.
- **401 handling**: Backend returns a result with `aiFeedback` and execution error message; frontend shows “Tests couldn’t run (runner service error). Your solution may still be correct — check AI feedback below.”

---

## 2. UPLOAD HOMEWORK MARKING FEATURE

### What it does
Users can **upload homework** (PDF or image) and get it **marked by AI**: a score (0–100) and written feedback. Supports writing and math. Also: “Get homework” (generate questions + optional PDF) and “Extract text” (from file to text or to a clean PDF).

### How it works (flow)
1. **Mark homework**: User opens Homework (or the upload modal), chooses “Mark”, optionally enters the question/topic, selects a file (PDF or image). Frontend sends `POST /api/v1/ai/mark-homework` with `multipart/form-data` (file + optional `question`).
2. Backend: if **image** → same flow as drawing (vision AI); if **PDF** → extract text with PDFBox, then send text to AI with a “teacher” prompt asking for `{ "score", "feedback" }`.
3. On **429** (e.g. Gemini quota), backend returns a short friendly message; frontend uses `friendlyAiError()` so the UI doesn’t show raw API JSON.
4. **Get homework**: User picks topic + difficulty; backend generates questions (AMC8 path uses AMC8 prompt); frontend can download a generated PDF.
5. **Extract text**: Upload image/PDF → backend returns extracted text or a “problems only” PDF.

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Frontend – modal** | `frontend/src/components/Practice/FileUploadModal.jsx` | Tabs: Get homework | Mark | Extract. Mark: file input (PDF, PNG, JPG, etc.), optional question; calls `markHomework(file, question)`. Shows score + feedback; 10MB limit. |
| **Frontend – API** | `frontend/src/api/ai.js` | `markHomework(file, question)` → FormData with `file` and optional `question`; `POST /api/v1/ai/mark-homework`. Uses `friendlyAiError(status, msg)` for 429/503. |
| **Frontend – entry** | `frontend/src/components/Home/HomeworkPage.jsx`, `App.jsx` | Homework page and modal trigger; `onOpenHomework` can open modal in “mark” or “get” mode. |
| **Backend – API** | `backend/.../api/ai/AIController.java` | `@PostMapping(value = "/mark-homework", consumes = MULTIPART_FORM_DATA)`: gets `MultipartFile` + optional `question`, calls `aiService.markHomework(file.getBytes(), contentType, question)`, returns `score`, `feedback`, `extractedText`. |
| **Backend – AI** | `backend/.../domain/service/AIService.java` | `markHomework(bytes, contentType, question)`: if image → `markDrawing(...)`; if PDF → extract text with PDFBox, then `callAi(prompt)` with teacher instructions, parse JSON for score/feedback. `friendlyMarkingError(message)` maps 429/quota/rate-limit to a short user-facing string for both marking endpoints. |

### Key implementation details
- **PDF path**: Uses Apache PDFBox to get text; truncates to 8000 chars for the prompt; response limited to 2000 chars in `extractedText` for the response body.
- **429/503**: Handled in backend (`friendlyMarkingError`) and frontend (`friendlyAiError`) so users see “Rate limit…” or “Service unavailable…” instead of raw error payloads.

---

## 3. MORE DIFFICULT QUESTIONS (CLOSER TO SKILL LEVEL)

### What it does
- **AMC 8 path**: Questions are **competition-caliber** (multi-step, non-trivial). No fallback to easy DB problems when AI is used.
- **DB content**: Seed/migrations (e.g. **V11**) replace easy AMC8 problems with harder ones (percent/reverse thinking, number theory, algebra, geometry, counting, probability, etc.).
- **AI generation**: When generating for AMC8, the backend uses a dedicated **AMC8 prompt** that forbids trivial arithmetic and asks for authentic problem types.

### How it works (flow)
1. **Practice load**: If path name matches `/AMC\s*8/i`, frontend **only** requests questions from AI: `generateQuestions(nodeName, 'hard', 7, pathName)`. No `getProblemsForNode` fallback; if AI fails, user sees an error and no easy DB questions.
2. **Backend generate**: `AIService.generateQuestions(topic, difficulty, count, pathName)` — if path is AMC8, uses `buildAMC8QuestionPrompt()`; otherwise `buildQuestionGenerationPrompt()`. AMC8 prompt tells the model to consider “what problem types are helpful for this topic at AMC 8 level” and lists authentic types (percent, number theory, algebra, geometry, counting, probability, rates, combinatorics, logic).
3. **DB**: Migration **V11** deletes old easy problems for nodes 101–119 and inserts competition-style problems; **V5** had added easier ones (later overridden by V11 for those nodes).

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Frontend** | `frontend/src/components/Practice/PracticeSession.jsx` | In `useEffect` for loading problems: `isAMC8 = pathName && /AMC\s*8/i.test(String(pathName).trim())`. If true, only `generateQuestions(nodeName, 'hard', 7, pathName)`; on success map to `problems`; on failure set error and empty list. |
| **Backend – AI** | `backend/.../domain/service/AIService.java` | `generateQuestions(..., pathName)`: if path name is AMC8 (e.g. contains “AMC 8”), use `buildAMC8QuestionPrompt(topic, count)`; else `buildQuestionGenerationPrompt(topic, difficulty, count)`. `buildAMC8QuestionPrompt` forbids trivial arithmetic and lists AMC8 problem types. |
| **DB** | `backend/.../resources/db/migration/V11__amc8_competition_caliber_problems.sql` | `DELETE FROM problem WHERE node_id BETWEEN 101 AND 119`; then `INSERT` many harder problems per node (algebra, fractions, geometry, counting, etc.). |

### Key implementation details
- AMC8 path is detected by **path name** (e.g. “AMC 8”), not by path id, so it works for any path named like AMC 8.
- Difficulty “hard” + pathName AMC8 is the trigger for the AMC8 prompt; the prompt explicitly says “NEVER generate trivial arithmetic” and gives concrete example types.

---

## 4. HINTS + SIMILAR QUESTIONS / LEARNING

### What it does
- **Learning mode**: User can switch to “Learning” so the AI gives **live hints** as they type (debounced). No need to submit to get feedback.
- **Similar example (hint)**: Button “💡 Show a similar example (hint)” fetches one similar question + solution to learn from, with “Reveal solution” toggle.
- **After wrong answer**: User can “Generate similar questions”; backend generates 3 similar questions (same concept, different wording/numbers) and they can be added to practice or used as follow-up.

### How it works (flow)
1. **Learning mode**: Toggle “Learning” in practice. When the user types, frontend **debounces** and calls `getLiveFeedback(question, answer)` → `POST /api/v1/ai/live-feedback`. Backend `AIService.getLiveFeedback(question, answer)` sends a short tutor prompt: “Give 1–3 short, actionable hints. Do NOT give the full answer.” Response is shown below the input.
2. **Similar example**: User clicks “Show a similar example (hint)”. Frontend calls `generateSimilarQuestions(questionForAi || nodeName, nodeName, 'CONCEPT')` → backend returns 3 similar questions; frontend takes the first and shows it as “Similar example” with optional “Reveal solution”.
3. **Generate similar questions (after wrong)**: From result screen, user can click “Generate similar questions”. Frontend calls same `generateSimilarQuestions(originalQuestion, topic, errorType)`; backend uses `buildSimilarQuestionPrompt` (same concept, slightly easier if CONCEPT). Frontend can add these to the session or show “We added N similar questions”.

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Frontend – practice** | `frontend/src/components/Practice/PracticeSession.jsx` | `aiMode` state: `'learning' \| 'submit'`. Learning: debounced `getLiveFeedback(question, yourAnswer)` and display. “💡 Show a similar example”: calls `generateSimilarQuestions(questionForAi, nodeName, 'CONCEPT')`, sets `similarExample` from first question; “Reveal solution” toggles `showExampleSolution`. After wrong: “Generate similar questions” and “Add similar” use `generateSimilarQuestions` and `similarQuestionsAdded`. |
| **Frontend – result** | `frontend/src/components/Practice/PracticeResult.jsx` | “✨ Generate similar questions” and logic to add them to the list. |
| **Frontend – API** | `frontend/src/api/ai.js` | `getLiveFeedback(question, answer)` → `POST /api/v1/ai/live-feedback`. `generateSimilarQuestions(originalQuestion, topic, errorType)` → `POST /api/v1/ai/generate-similar-questions`. |
| **Backend – API** | `backend/.../api/ai/AIController.java` | `@PostMapping("/live-feedback")`, `@PostMapping("/generate-similar-questions")` with request DTOs; call `aiService.getLiveFeedback(...)` and `aiService.generateSimilarQuestions(...)`. |
| **Backend – AI** | `backend/.../domain/service/AIService.java` | `getLiveFeedback(question, answer)`: if answer blank, return “Type or draw your answer above…”; else prompt: “Give 1–3 short, actionable hints. Do NOT give the full answer.” `generateSimilarQuestions(original, topic, errorType)`: `buildSimilarQuestionPrompt` asks for 3 similar questions (same concept, slightly easier if CONCEPT); returns parsed list. |

### Key implementation details
- Live feedback is **debounced** in the frontend to avoid calling the API on every keystroke.
- Similar example reuses **generate-similar-questions**; the UI only displays the first question and its solution.
- Error type (e.g. CONCEPT) is passed so the model can tune difficulty (“slightly easier if error was CONCEPT”).

---

## 5. CHANGED COLOUR SCHEME TO BRIGHTER

### What it does
The app uses a **soft, bright palette** (light background, pastel accents) so the UI feels clean and readable. Shared tokens ensure consistency across home, practice, modals, and layout.

### How it works
- **CSS theme** in `frontend/src/index.css` defines `@theme` variables (e.g. `--color-app-bg`, `--color-app-primary`, `--color-app-accent1`). Background is light (`#FBFBFF`), primary pink (`#FF6FAE`), accent violet (`#7C5CFF`), borders and muted text for contrast.
- **Components** use Tailwind classes that reference these or equivalent hex values: e.g. `bg-[#FBFBFF]`, `bg-[#7C5CFF]`, `text-[#1F2937]`, `border-[#E9E7F5]`, so the same palette appears on Home, Homework, PathSelector, FileUploadModal, PageLayout, buttons, and cards.
- **React Flow** (skill tree) is overridden so background and controls use the same light/pastel look.

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Global theme** | `frontend/src/index.css` | `@theme { --color-app-bg: #FBFBFF; --color-app-primary: #FF6FAE; ... }`. `body` uses `var(--color-app-bg)` and `var(--color-app-text)`. `.react-flow__*` overrides for pastel background and controls. |
| **Layout / pages** | `frontend/src/components/Layout/PageLayout.jsx`, `HomePage.jsx`, `HomeworkPage.jsx` | Headers and main areas use `bg-[#FBFBFF]`, `border-[#E9E7F5]`, `text-[#1F2937]`, `text-[#6B7280]`, accent buttons `bg-[#7C5CFF]`, `bg-[#FF6FAE]`. |
| **Modals / cards** | `frontend/src/components/PathSelector/PathSelector.jsx`, `FileUploadModal.jsx` | Cards and tabs use same palette (e.g. `#FAFAFF`, `#7C5CFF`, `#E9E7F5`). `HomePage.jsx` uses `ACCENT_CLASSES` (violet, amber, sky, emerald, etc.) for card accents. |
| **App shell** | `frontend/src/App.jsx` | Nav and primary actions use `#7C5CFF`, `#FF6FAE`, `#FBFBFF`, `#6B7280`. |

### Key implementation details
- One source of truth is the **hex values** in `index.css` and repeated in Tailwind classes where needed; `@theme` is used for body and any CSS that references variables.
- Practice session and code editor keep a **dark** panel (slate) for the problem/code area so the “bright” theme is the shell; inner content stays readable with light-on-dark for code.

---

## 6. BUG FIXES: RESPONSIVE LAYOUT, DRAWING CURSOR

### What was fixed
- **Responsive layout**: Content is centered and readable on mobile and desktop; no horizontal overflow; typography and spacing scale with viewport.
- **Drawing cursor**: The drawing canvas was misaligned with the mouse/touch (stroke appeared in the wrong place). Fix: size the canvas to the **container** and use correct coordinate scaling so cursor position and draw position match 1:1.

### How it works (responsive)
- **PageLayout**: `max-w-7xl mx-auto` on header, `max-w-6xl` (or prop) on main; `px-4 sm:px-6 lg:px-8`; `flex flex-col items-center justify-center` so content is centered. Back button and title use `truncate` and `min-w-0` to avoid overflow.
- **HomePage**: `max-w-4xl mx-auto` for title and card grid; `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; cards `max-w-sm`; responsive padding and font sizes (`text-3xl sm:text-4xl md:text-5xl`, etc.).
- **Global**: `index.css`: `html { overflow-x: hidden }`, `font-size: clamp(15px, 0.9vw + 14px, 17px)` for a slight responsive base; `body` and `#root` use `min-height: 100dvh` and `overflow-x: hidden` to avoid horizontal scroll.

### How it works (drawing cursor)
- **DrawingCanvas** uses a **container ref** (`containerRef`) and sizes the **canvas** to that container’s width and height (with device pixel ratio for sharp lines). So the canvas’s *display* size (CSS) matches its *logical* size used for drawing.
- **Coordinate conversion**: `getCanvasCoords(e)` uses `canvas.getBoundingClientRect()` and accounts for `canvas.width/height` vs `rect.width/height` and `dpr` so that `clientX/clientY` map correctly to canvas coordinates. Strokes are drawn at the same position as the cursor.
- **ResizeObserver**: When the container resizes (e.g. orientation or window resize), the canvas is resized and cleared so it never gets out of sync with the container.

### Where it’s coded

| Layer | File | Role |
|-------|------|------|
| **Responsive** | `frontend/src/index.css` | `html` overflow-x, clamp font-size; body/root min-height and overflow-x. |
| **Responsive** | `frontend/src/components/Layout/PageLayout.jsx` | Centered main, responsive padding, `maxWidth` prop, truncation. |
| **Responsive** | `frontend/src/components/Home/HomePage.jsx` | Grid breakpoints, max-widths, responsive text and padding. |
| **Drawing** | `frontend/src/components/Practice/DrawingCanvas.jsx` | `containerRef` wraps the canvas. `useEffect`: set `canvas.width/height` and `canvas.style.width/height` from `container.clientWidth/clientHeight` and dpr; `getCanvasCoords(e)` scales `clientX/clientY` by `rect` and canvas size/dpr; `ResizeObserver` updates canvas size on container resize. |

### Key implementation details
- The fix is **“size canvas to container, then map pointer events to canvas coordinates using the same dimensions and dpr”**. That way the drawn path follows the cursor.
- Responsive layout uses **Tailwind breakpoints** (`sm:`, `md:`, `lg:`) and **max-widths** (`max-w-4xl`, `max-w-6xl`) so content doesn’t stretch too wide on large screens and stays usable on small ones.

---

## Quick reference: API endpoints used by these features

| Feature | Endpoint | Method |
|---------|----------|--------|
| Code in app | `/api/v1/ai/check-code` | POST (JSON: problemStatement, code, language, testCases) |
| Mark homework | `/api/v1/ai/mark-homework` | POST (multipart: file, question) |
| Generate questions (incl. AMC8) | `/api/v1/ai/generate-questions` | POST (JSON: topic, difficulty, count, pathName) |
| Live feedback (hints) | `/api/v1/ai/live-feedback` | POST (JSON: question, answer) |
| Similar questions / example | `/api/v1/ai/generate-similar-questions` | POST (JSON: originalQuestion, topic, errorType) |
| Generate homework PDF | `/api/v1/ai/generate-homework-pdf` | POST (JSON: topic, difficulty, count, pathName) → PDF blob |

All require an authenticated session (cookie) unless the app is configured to allow unauthenticated access.
