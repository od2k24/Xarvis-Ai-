# 🚀 Xarvis AI — Complete SaaS App

Your AI co-founder for content creators. Full-stack SaaS with landing page, chat app, voice features, and pricing.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your API key (Anthropic or OpenAI)

# 3. Start the server
npm start
# OR for development with auto-reload:
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## What's Included

### Frontend
- **Landing Page** (`public/index.html`) — full marketing page matching original design
- **Chat App** (`public/app.html`) — ChatGPT-style interface with:
  - Chat bubbles + scrollable history
  - Sidebar with quick actions + chat history
  - Pricing tiers (Starter / Creator Pro / Creator Elite)
  - Voice input (Speech-to-Text via Web Speech API)
  - Text-to-Speech for AI responses
  - Memory via localStorage (persists across sessions)
  - Message limits for free plan
  - Upgrade modal with mock subscription

### Backend
- **Express server** (`server.js`)
- `/api/chat` endpoint supporting:
  - Anthropic Claude (claude-3-5-haiku)
  - OpenAI GPT-4o-mini
  - Demo mode (no API key needed)
- Static file serving
- Health check endpoint: `/api/health`

---

## API Keys

Add to your `.env` file:

```env
# Anthropic (recommended)
ANTHROPIC_API_KEY=sk-ant-...

# OR OpenAI
OPENAI_API_KEY=sk-...
```

Without an API key, the app runs in **demo mode** with pre-written responses.

---

## Pricing Tiers

| Plan | Price | Messages/day | Memory | Full AI |
|------|-------|-------------|--------|---------|
| 🟢 Starter | Free | 10 | ❌ | Basic |
| 🔵 Creator Pro | $12/mo | Unlimited | ✅ | ✅ |
| 🟣 Creator Elite | $39/mo | Unlimited | ✅ | ✅ + Monetization |

> **Note:** Stripe integration placeholder is included. To enable real payments, add Stripe to `server.js` and configure webhook endpoints.

---

## Voice Features

- **Microphone button** → Speech-to-Text (Chrome / Safari supported)
- **TTS toggle** → AI responses read aloud
- Works in Chrome, Edge, Safari (not Firefox)

---

## Deploy

### Render / Railway / Heroku
```bash
# Set environment variable: ANTHROPIC_API_KEY
# Start command: npm start
# Build command: npm install
```

### Vercel (serverless)
Convert `server.js` to `/api/chat.js` serverless function.

---

## File Structure

```
xarvis-ai/
├── public/
│   ├── index.html    ← Landing page
│   └── app.html      ← Chat app
├── server.js         ← Express backend
├── package.json
├── .env.example
└── README.md
```
