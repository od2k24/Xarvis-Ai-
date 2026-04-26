# Xarvis AI V3 — Phase 1

**AI Co-Founder for Creators and Solo Founders.**

> Phase 1: Streaming chat system with goal memory. Deployed on Vercel.

---

## 🗂️ File Structure

```
xarvis-ai/
├── index.html          ← Landing page (goal input)
├── app.html            ← Main chat interface
├── style.css           ← Shared stylesheet
├── app.js              ← Frontend logic (ES module)
├── config.js           ← API URL + settings
├── api/
│   └── chat.js         ← Vercel Edge Function (Groq streaming)
├── package.json
├── vercel.json         ← Vercel routing config
├── nixpacks.toml       ← Railway compatibility (optional)
└── .env.example        ← Environment variable template
```

---

## ⚡ Quick Deploy (Vercel)

### Step 1 — Get a Groq API Key
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up / sign in
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "feat: Xarvis AI V3 Phase 1"
git remote add origin https://github.com/YOUR_USERNAME/xarvis-ai.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. **Framework Preset**: `Other`
4. **Root Directory**: `/` (default)
5. Click **Deploy**

### Step 4 — Set Environment Variables
In Vercel dashboard → Your Project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | `gsk_your_key_here` |

Apply to: **Production**, **Preview**, **Development**

Then go to **Deployments** → **Redeploy** (latest deployment).

### Step 5 — Verify Deployment
Test the streaming endpoint:
```bash
curl -X POST https://xarvis-ai.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"goal":"Make £5K/month from YouTube"}'
```

You should see streamed SSE data in the terminal.

---

## 🛠️ Local Development

```bash
# Install Vercel CLI
npm install

# Copy env file
cp .env.example .env.local
# Then add your GROQ_API_KEY to .env.local

# Start local dev server
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Live URLs (after deployment)

| Page | URL |
|------|-----|
| Landing | `https://xarvis-ai.vercel.app/` |
| App | `https://xarvis-ai.vercel.app/app.html` |
| API | `https://xarvis-ai.vercel.app/api/chat` |

---

## 🏗️ Architecture

### Phase 1 (Implemented)
- ✅ Streaming chat via Groq API (llama-3.3-70b-versatile)
- ✅ Goal memory via localStorage
- ✅ Clean ChatGPT-style UI
- ✅ Vercel Edge Function for minimal latency
- ✅ Auto-resizing textarea
- ✅ Chat history persistence

### Phase 2 (Designed, not implemented)
- ⬜ JWT authentication
- ⬜ Dashboard with goal tracking
- ⬜ Planning agent

### Phase 3 (Designed, not implemented)
- ⬜ Multi-agent system
- ⬜ PostgreSQL/MongoDB memory
- ⬜ Stripe monetization
- ⬜ Usage tracking

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key |
| `DATABASE_URL` | ❌ Phase 2+ | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | ❌ Phase 3 | Stripe secret key |

---

## 🧪 Troubleshooting

**Streaming not working:**
- Check `GROQ_API_KEY` is set in Vercel env vars
- Ensure you redeployed after adding the env var
- Check browser console for CORS errors

**Blank page on app.html:**
- Open browser console — likely a JS module import error
- Ensure `config.js` exists and exports `CONFIG`

**API returns 500:**
- `GROQ_API_KEY` is missing or invalid
- Check Vercel function logs: Project → Functions → chat → Logs
