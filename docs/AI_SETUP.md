# AI API setup (Generate path, questions, marking, hints)

## Quick connect (use one key)

**Option 1 – Gemini (free)**  
1. Get a key: [Google AI Studio](https://aistudio.google.com/app/apikey)  
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY=your-key`  
3. Load and start: `source .env` then `cd backend && mvn spring-boot:run` (or `./start-all.sh`)

**Option 2 – OpenAI**  
1. Get a key from [OpenAI](https://platform.openai.com/api-keys)  
2. In `.env` set `OPENAI_API_KEY=sk-your-key`  
3. `source .env` then start the backend  

If no key is set, generate/similar questions return a clear error; marking and check-answer show “AI is not configured” with a link to get a key.

Optional: set `OPENAI_API_BASE` to use another endpoint (e.g. Azure, Groq):  
`export OPENAI_API_BASE=https://api.groq.com/openai/v1`

## Which AI is used?

**OpenAI** (ChatGPT API): `https://api.openai.com/v1/chat/completions`  
Model used: `gpt-4o-mini` (configurable in code).

## When is it used?

- **Generate path** – “Generate with AI” in path selector: builds a learning path from your description.
- **Generate more questions** – Button during practice: creates extra practice problems for the current skill.
- **Generate similar questions** – After logging a wrong answer: creates similar questions to practice the same concept.

## Do I need an API key?

- **Without a key**: “Generate path” still works and returns a **default template** (e.g. Introduction → Core Concepts → Practice). Other AI features return no extra content.
- **With a key**: All of the above use real OpenAI responses.

## How to set the API key

1. Get an API key from [OpenAI API](https://platform.openai.com/api-keys).
2. Set it when starting the backend.

**Option A – Environment variable (recommended)**

```bash
export OPENAI_API_KEY=sk-your-key-here
cd backend
mvn spring-boot:run
```

**Option B – When using `start-all.sh`**

```bash
export OPENAI_API_KEY=sk-your-key-here
./start-all.sh
```

**Option C – In `application.yml` (not for production)**

```yaml
ai:
  openai:
    api-key: sk-your-key-here
```

Do not commit the key to git.

## Troubleshooting

- **“Not found” when pressing Generate path**  
  Backend may be old or not running. Restart it (e.g. run `./start-all.sh` again). Use the frontend URL it prints (e.g. http://localhost:5174).

- **“Not authenticated”**  
  Log in first; Generate path requires an active session.

- **Only default 3 steps, no custom path**  
  No API key is set. Set `OPENAI_API_KEY` and restart the backend for custom AI paths.
