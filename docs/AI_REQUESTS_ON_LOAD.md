# AI Requests: When Does the App Call the API?

MasteryPath only calls AI (Gemini/OpenAI) when a feature that needs AI is used. **Nothing calls AI on initial app load.**

---

## On “Load” (What Counts as Load?)

| What loads | AI requests |
|------------|-------------|
| **App first load** (login, home, dashboard) | **0** |
| **Open Map, select a path** | **0** (paths/nodes from DB) |
| **Start practice on a non–AMC 8 node** (e.g. Blind 75 Two Sum) | **0** (problems from DB or built-in test cases) |
| **Start practice on an AMC 8 node** | **0** if cached, else **1** (generate 5 questions in one API call; cache 30 min per node) |

So in practice:

- **Blind 75 / most paths:** Opening a practice session does **0** AI requests. Problems come from the database (or, for Run tests on Two Sum, from built-in test cases).
- **AMC 8 path only:** First time you open a node = **1** AI request (5 questions). Re-opening the same node within 30 min = **0** (uses session cache).

---

## AI Requests by User Action (Not on Load)

Each row is **one user action**; the number is how many **AI API calls** that action can trigger.

| User action | AI requests (typical) |
|-------------|------------------------|
| **Generate path** (AI modal) | 1 |
| **Generate questions** (e.g. AMC 8 practice load) | 1 |
| **Submit answer** (check answer) | 1 |
| **Live feedback** (Learning mode) | 1 per debounced request (min 15 chars, 1.8 s debounce) |
| **Run tests** (coding) – test cases from AI | 1 (test case generation) + 0–1 (code feedback only if tests failed) |
| **Run tests** (Two Sum, all pass) | 0 (built-in cases + no AI feedback when all pass) |
| **Show similar example (hint)** | 1 |
| **Generate similar questions** (after wrong answer) | 1 |
| **Generate homework PDF** | 1 |
| **Mark homework** (image or PDF) | 1 (image: vision; PDF: extract + 1 text call) |
| **Mark drawing** | 1 (vision) |
| **Extract text to PDF** (problems only) | 1 (if image; PDF-only path uses PDFBox, no AI) |

---

## Backend: One Request = One Model Call

- **generate-questions** (and AMC 8): 1 call to Gemini/OpenAI; the model returns a JSON array of all questions in one response.
- **check-code**: Test case generation = 1 call when AI is used (Two Sum uses built-in, so 0). Code feedback = 1 call only when at least one test failed; when all pass, no AI call.
- **mark-homework** (image): 1 vision call. (PDF: no vision; extract text with PDFBox then 1 text call.)
- **live-feedback**: 1 call per debounced request.

So “how many AI requests does this program do every time it loads?”:

- **0** for normal app load and for opening practice on most paths (including Blind 75).
- **0** when you re-open an AMC 8 node within 30 min (cached).
- **1** the first time you open an AMC 8 node in a session (one batch of 5 questions, then cached).

---

## Minimizations in place

- **AMC 8 questions:** Cached in `sessionStorage` per path+node for 30 minutes; count reduced from 7 to 5 per request.
- **Live feedback:** Only requested when answer has ≥15 characters; debounce increased from 800 ms to 1800 ms.
- **Run tests (code):** AI code feedback is **skipped** when all tests pass (static “All tests passed!” message instead). Feedback is only requested when at least one test fails or execution errors.
