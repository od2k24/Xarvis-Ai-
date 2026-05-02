# Xarvis AI — Clean Rebuild

Production-ready AI SaaS with Express backend + vanilla JS frontend.

---

## File Structure

```
xarvis-ai/
├── server/
│   ├── index.js              ← Express entry point
│   ├── package.json
│   ├── .env.example          ← Copy to .env
│   └── routes/
│       ├── health.js         ← GET  /api/health
│       ├── chat.js           ← POST /api/chat
│       └── generate.js       ← POST /api/generate
│
└── frontend/
    └── index.html            ← Single-file UI (no framework)
```

---

## Setup Instructions

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Then edit .env and paste your Groq API key:
# GROQ_API_KEY=gsk_...
```

Get a free Groq API key at: https://console.groq.com

### 3. Start the server

```bash
# Development (auto-restart on save)
npm run dev

# Production
npm start
```

Server runs on: http://localhost:3001

### 4. Test the health check

```bash
curl http://localhost:3001/api/health
# → {"status":"running"}
```

### 5. Open the frontend

Open `frontend/index.html` in your browser.
Update `BACKEND_URL` in the `<script>` tag if your server runs on a different URL.

---

## API Reference

### GET /api/health
Returns server status.
```json
{ "status": "running" }
```

### POST /api/chat
Multi-turn conversation endpoint.
```json
// Request
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "systemPrompt": "Optional system prompt"
}

// Response
{
  "reply": "Hi! How can I help you today?",
  "model": "llama3-8b-8192",
  "usage": { "prompt_tokens": 20, "completion_tokens": 10, "total_tokens": 30 }
}
```

### POST /api/generate
Single-shot content generation.
```json
// Request
{
  "prompt": "Write a hook for a YouTube video about discipline",
  "temperature": 0.8,
  "maxTokens": 1024
}

// Response
{
  "output": "Most people quit when it gets hard...",
  "model": "llama3-8b-8192",
  "usage": { ... }
}
```

---

## Deploying to Production

### Backend → Railway / Render / Fly.io
1. Push `server/` to GitHub
2. Connect to Railway/Render
3. Set `GROQ_API_KEY` as an environment variable
4. Copy the deployed URL

### Frontend → Netlify / Vercel / GitHub Pages
1. Update `BACKEND_URL` in `frontend/index.html` to your deployed backend URL
2. Deploy the `frontend/` folder

---

## Critical Rules (Never Break)

- All API calls go through `apiRequest(path, payload)` — never raw `fetch`
- Routes always include the `/api` prefix — never `/chat` directly
- `BACKEND_URL` is defined in exactly one place
- No duplicate scripts or route definitions
