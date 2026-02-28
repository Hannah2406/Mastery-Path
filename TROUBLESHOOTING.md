# Why don’t features work?

Most “it doesn’t work” issues come from **what’s running**, **how you start**, and **where you open the app**. Use this checklist.

---

## 1. Use the right way to start the app

**Recommended:** use the all-in-one script so DB, backend, and frontend all start with the right config (including `.env`):

```bash
./start-all.sh
```

Then open the **frontend URL** it prints (e.g. `http://localhost:5173`). Do **not** open `http://localhost:8080` in the browser for normal use — that’s the API; the UI is on the Vite port.

**If you start things manually:**

1. **Database first:**  
   `docker compose up -d`  
   (No Docker → no DB → backend will fail or you’ll see connection errors.)

2. **Backend second:**  
   From project root, ensure `.env` is in the project root with at least one of `GEMINI_API_KEY` or `OPENAI_API_KEY` if you want AI. Then:
   - Either: `cd backend && mvn spring-boot:run`  
   - Or use `./start-all.sh` (it sources `.env` and starts the backend).

   **Restart the backend** after changing `.env`; the backend reads env on startup.

3. **Frontend third:**  
   `cd frontend && npm install && npm run dev`  
   Open the URL Vite prints (e.g. `http://localhost:5173`). The frontend proxies `/api` to the backend; if you open the wrong port or skip the frontend, API calls can fail or CORS can bite.

---

## 2. Open the app in the browser correctly

- **Correct:** open the **frontend** URL (e.g. `http://localhost:5173`). The UI is served there and it talks to the backend via the proxy.
- **Wrong:** opening only `http://localhost:8080` — you’ll see JSON or errors, not the real app.

---

## 3. Log in

Many features require you to be logged in (paths, practice, generate questions, homework marking, marketplace import, etc.). If you’re not logged in, those calls return 401 and the UI may show “Please log in” or empty data.

- Use **Register** or the demo account: `demo@masterypath.app` / `demo` (if seed data is present).

---

## 4. AI features (“AI not configured”, no marking, no generate)

- **Cause:** Backend doesn’t see an API key.
- **Fix:**
  1. In the **project root**, create or edit `.env` (copy from `.env.example`).
  2. Set at least one of:
     - `GEMINI_API_KEY=your_key` (free at [Google AI Studio](https://aistudio.google.com/app/apikey))
     - `OPENAI_API_KEY=your_key`
  3. **Restart the backend** (stop and start again). Keys are read at startup.
  4. If you use `./start-all.sh`, it loads `.env` from the project root before starting the backend.

If you still see “AI is not configured” after restart, check that `.env` is in the project root (or in `backend/`) and that the key has no extra spaces or quotes that might break parsing.

---

## 5. Empty marketplace

- **Cause:** No marketplace seed data (e.g. DB created before V8, or not using PostgreSQL).
- **Fix:** Use **PostgreSQL** (default). Start DB with `docker compose up -d`, then start the backend **without** the `h2` profile. Flyway will run and V8 will seed marketplace paths. See **DATA.md** for details.
- If the DB was created before V8 existed, you may need a fresh DB (e.g. new volume) or to ensure all migrations have run.

---

## 6. “Generate homework” / “Generate questions” does nothing or shows an error

- **No / empty list:** Usually “AI is not configured” (see section 4) or not logged in (see section 3). Check the small error text under the button and the browser dev tools Network tab for 503 or 401.
- **401:** Log in again.
- **503:** Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to `.env` and restart the backend.

---

## 7. Drawing / homework marking doesn’t work

- **“AI is not configured” in the result:** Same as section 4 — add a key to `.env` and restart the backend.
- **Upload or submit does nothing:** Check you’re logged in and that the backend is running; check the Network tab for failed requests (4xx/5xx).

---

## 8. Code run / “Run tests” (LeetCode-style) doesn’t work

- Backend uses **Piston** for execution. If run/tests fail, check backend logs for Piston/network errors.
- Ensure you’re on a node that has a coding problem (e.g. node with LeetCode link) and that you’re logged in.

---

## 9. Quick sanity check

1. **Backend up:**  
   `curl -s http://localhost:8080/api/v1/health`  
   Should return JSON with e.g. `"database":"connected"`.

2. **Frontend up:**  
   Open `http://localhost:5173` (or the port Vite shows) and you should see the app.

3. **Logged in:**  
   Use the app; if paths/practice/marketplace work, you’re in.

4. **AI:**  
   After setting `.env` and restarting the backend, try “Generate questions” or homework marking again.

---

## 10. Still broken?

- **Backend logs:**  
  If you used `./start-all.sh`, run `tail -f backend.log` in the project root. Otherwise check the terminal where you ran `mvn spring-boot:run`.
- **Browser:**  
  Open DevTools → Network. Reproduce the action and see which request fails (URL, status code, response body).
- **Database:**  
  If the backend says DB is disconnected, run `docker compose up -d` and wait a few seconds, then restart the backend.

Summarizing: use `./start-all.sh`, open the **frontend** URL, log in, put AI keys in `.env` and restart the backend, and use PostgreSQL so marketplace and data persist.
