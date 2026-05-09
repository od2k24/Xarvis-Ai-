# Xarvis AI — Creator Operating System

Full-stack AI SaaS. Express backend (Groq AI) + pure HTML/CSS/JS frontend.
**API key lives only on the backend. Frontend never touches it.**

---

## Folder Structure

```
xarvis-ai/
├── server/
│   ├── index.js              ← Express entry point
│   ├── package.json
│   ├── .env.example          ← Copy → .env and add key
│   └── routes/
│       ├── chat.js           ← POST /api/chat/stream  (SSE streaming)
│       ├── generate.js       ← POST /api/generate     (viral, postnext, calendar, feedback)
│       └── agent.js          ← POST /api/agent/plan   (SSE streaming)
│
├── frontend/
│   ├── index.html            ← Landing page (splash → hero → features)
│   └── app.html              ← Full OS dashboard (all 7 tools)
│
└── README.md
```

---

## Quick Start

### 1 — Install backend

```bash
cd server
npm install
```

### 2 — Add your Groq API key

```bash
cp .env.example .env
# Open .env and paste your key:
# GROQ_API_KEY=gsk_...
```

Get a free key at https://console.groq.com

### 3 — Start the server

```bash
npm run dev      # development (auto-restarts)
npm start        # production
```

Server → http://localhost:3001

### 4 — Open the frontend

```bash
# Option A: just open the file
open frontend/index.html

# Option B: serve locally (recommended)
npx serve frontend
# → http://localhost:3000
```

### 5 — Verify it works

```bash
curl http://localhost:3001/api/health
# → { "ok": true, "status": "online" }
```

---

## Deploy to Production

### Backend → Railway / Render / Fly.io

1. Push `server/` folder to GitHub
2. Connect repo to Railway or Render
3. Set environment variable: `GROQ_API_KEY=gsk_...`
4. Note the deployed URL (e.g. `https://xarvis-ai.up.railway.app`)

### Frontend → Netlify / Vercel / GitHub Pages

1. Open `frontend/app.html`
2. Find the `BACKEND` constant at the top of the `<script>` tag
3. Replace the production URL with your deployed backend URL
4. Deploy the `frontend/` folder

---

## API Reference

| Method | Endpoint            | Body                                      | Response          |
|--------|---------------------|-------------------------------------------|-------------------|
| GET    | /api/health         | —                                         | `{ ok: true }`   |
| POST   | /api/chat/stream    | `{ message, history[], context }`         | SSE stream        |
| POST   | /api/generate       | `{ type, topic, platform, content, memory }` | `{ reply }`   |
| POST   | /api/agent/plan     | `{ goal, context, memory }`               | SSE stream        |

### SSE Event format (chat + agent)
```json
{ "type": "delta",   "content": "chunk of text" }
{ "type": "done"                                  }
{ "type": "error",   "message": "reason"          }
```

### Generate types
- `viral` — requires `topic`
- `postnext` — uses `memory.niche`, `memory.platform`, `memory.tone`
- `calendar` — uses `memory.niche`, `memory.platform`
- `feedback` — requires `content`
