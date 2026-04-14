import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// CORS
// ============================================================
app.use(cors({
  origin: [
    'https://od2k24.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json());

// ============================================================
// AUTH
// ============================================================
const API_KEY = process.env.XARVIS_API_KEY || 'xarvis-dev-key-change-me';

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ============================================================
// RATE LIMIT
// ============================================================
const rateMap = new Map();

const LIMITS = {
  starter: 10,
  pro: Infinity,
  elite: Infinity,
};

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  const plan = req.body?.plan || 'starter';
  const limit = LIMITS[plan] ?? 10;

  if (limit === Infinity) return next();

  const today = new Date().toDateString();
  const record = rateMap.get(ip);

  if (!record || record.date !== today) {
    rateMap.set(ip, { count: 1, date: today });
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: 'Daily limit reached',
      upgradeRequired: true
    });
  }

  record.count++;
  next();
}

// cleanup
setInterval(() => {
  const today = new Date().toDateString();
  for (const [ip, r] of rateMap.entries()) {
    if (r.date !== today) rateMap.delete(ip);
  }
}, 60 * 60 * 1000);

// ============================================================
// 🧠 MEMORY (IMPROVED)
// ============================================================
const memoryStore = new Map();

// ============================================================
// 🔥 VIRAL SCORE (UPGRADED)
// ============================================================
function calculateViralScore(text) {
  let score = 50;
  const lower = text.toLowerCase();

  const hooks = [
    "you won't believe",
    "this changed",
    "no one tells you",
    "secret",
    "stop doing",
    "before it's too late"
  ];

  if (hooks.some(h => lower.includes(h))) score += 20;
  if (text.includes("?")) score += 10;
  if (text.length < 300) score += 10;
  if (text.includes("1.") || text.includes("•")) score += 10;
  if (lower.includes("fast") || lower.includes("now")) score += 10;

  return Math.min(100, score);
}

// ============================================================
// 🧠 AI CALL WRAPPER (SMART FALLBACK)
// ============================================================
async function callAI(message, history, systemPrompt) {
  return (
    await tryGemini(message, history, systemPrompt)
  ) || (
    await tryGroq(message, history, systemPrompt)
  );
}

// ============================================================
// 🧠 REAL MULTI-AGENT SYSTEM
// ============================================================
async function runAgents(message, history, memory, plan) {

  const context = `
User message: ${message}
Niche: ${memory?.niche || "unknown"}
Goals: ${memory?.goals || "unknown"}
`;

  // Run in parallel (FASTER)
  const [strategy, viral, money] = await Promise.all([

    callAI(
      context + "\nCreate a growth strategy.",
      history,
      "You are a YouTube growth strategist."
    ),

    callAI(
      context + "\nCreate 3 viral hooks.",
      history,
      "You are a viral content expert."
    ),

    callAI(
      context + "\nExplain how to monetize this.",
      history,
      "You are a monetization expert."
    )

  ]);

  return `
🔥 GOAL
${message}

⚡ STRATEGY
${strategy}

🎯 VIRAL IDEAS
${viral}

💰 MONETIZATION
${money}

🚀 EDGE
This combines strategy + virality + monetization → maximizes growth + revenue.
`;
}

// ============================================================
// HEALTH
// ============================================================
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis V3.5 Running 🚀' });
});

// ============================================================
// CHAT ENDPOINT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  try {
    const { message, history = [], plan = "starter" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message" });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    // Init memory
    if (!memoryStore.has(ip)) {
      memoryStore.set(ip, {
        messages: [],
        niche: null,
        goals: null
      });
    }

    const userMemory = memoryStore.get(ip);

    // Update memory
    userMemory.messages.push(message);
    userMemory.messages = userMemory.messages.slice(-25);

    const lower = message.toLowerCase();

    if (lower.includes("fitness")) userMemory.niche = "fitness";
    if (lower.includes("youtube")) userMemory.niche = "youtube";
    if (lower.includes("money")) userMemory.goals = "make money";
    if (lower.includes("grow")) userMemory.goals = "growth";

    console.log("📩 MSG:", message);
    console.log("🧠 MEMORY:", userMemory);

    // 🧠 RUN AGENTS
    const reply = await runAgents(message, history, userMemory, plan);

    const viralScore = calculateViralScore(reply);

    res.json({
      reply,
      plan,
      viralScore,
      memory: userMemory
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GEMINI
// ============================================================
async function tryGemini(message, history, systemPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  contents.push({ role: 'user', parts: [{ text: message }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.8
        }
      })
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ============================================================
// GROQ
// ============================================================
async function tryGroq(message, history, systemPrompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message }
      ],
      max_tokens: 1000
    })
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Xarvis V3.5 running on ${PORT}`);
  console.log(`🔐 API Key: ${!!process.env.XARVIS_API_KEY}`);
  console.log(`🤖 Gemini: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`⚡ Groq: ${!!process.env.GROQ_API_KEY}`);
});
