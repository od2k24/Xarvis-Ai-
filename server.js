import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// CORS (same as your old system)
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
// AUTH (UNCHANGED)
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
// RATE LIMIT (UNCHANGED CORE IDEA)
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
// 🧠 REAL MEMORY SYSTEM (UPGRADED)
// ============================================================
const memoryStore = new Map();

/*
memory structure:
ip -> {
  niche,
  goals,
  messages[],
  strategyProfile
}
*/

// ============================================================
// 🔥 VIRAL SCORING ENGINE (NEW)
// ============================================================
function calculateViralScore(text) {
  let score = 50;

  const hooks = ["you won't believe", "this changed", "no one tells you", "secret", "stop doing"];
  const hasHook = hooks.some(h => text.toLowerCase().includes(h));
  if (hasHook) score += 15;

  if (text.includes("?")) score += 5;
  if (text.length < 200) score += 10;
  if (text.includes("🔥") || text.includes("viral")) score += 10;

  return Math.min(100, score);
}

// ============================================================
// 🧠 MULTI-AGENT OPERATOR BRAIN
// ============================================================
function operatorBrain(message, plan, memory) {

  const base = `
You are Xarvis AI — an elite CREATOR OPERATING SYSTEM.

You are NOT a chatbot.

You act like a:
- YouTube growth operator
- Content strategist
- Monetization engineer

You optimize for:
→ Views
→ Followers
→ Revenue

`;

  const agentLayer = `
You run 3 internal thinking agents:

1. STRATEGIST AI → plans growth path
2. VIRAL ENGINE → creates hooks & viral ideas
3. MONETIZATION AI → turns views into money

You combine all 3 into ONE answer.
`;

  const outputFormat = `
🔥 GOAL
⚡ STRATEGY
🧠 EXECUTION (step-by-step)
🎯 EXACT OUTPUT (script/hook/content)
💰 MONETIZATION ANGLE
🚀 VIRAL EDGE
`;

  const planBoost =
    plan === "elite"
      ? "User is ELITE → give business-level scaling systems, funnels, automation."
      : plan === "pro"
      ? "User is PRO → give advanced creator monetization + systems."
      : "User is STARTER → keep simple but high impact, push upgrade naturally.";

  const memoryBlock = `
USER MEMORY:
Niche: ${memory?.niche || "unknown"}
Goals: ${memory?.goals || "unknown"}
`;

  return base + agentLayer + planBoost + memoryBlock + outputFormat;
}

// ============================================================
// HEALTH
// ============================================================
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis V3 Operator Running 🚀' });
});

// ============================================================
// MAIN CHAT ENDPOINT (UPGRADED CORE)
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  try {
    const { message, history = [], plan = "starter" } = req.body;

    if (!message) return res.status(400).json({ error: "No message" });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    // init memory
    if (!memoryStore.has(ip)) {
      memoryStore.set(ip, {
        messages: [],
        niche: null,
        goals: null,
        strategyProfile: null
      });
    }

    const userMemory = memoryStore.get(ip);

    // update memory (simple intelligence)
    userMemory.messages.push(message);
    userMemory.messages = userMemory.messages.slice(-25);

    if (message.toLowerCase().includes("fitness")) userMemory.niche = "fitness";
    if (message.toLowerCase().includes("youtube")) userMemory.niche = "youtube";

    const systemPrompt = operatorBrain(message, plan, userMemory);

    console.log("📩 MSG:", message);
    console.log("📊 PLAN:", plan);
    console.log("🧠 MEMORY:", userMemory);

    // 🔥 Try AI engines
    const reply =
      (await tryGemini(message, history, systemPrompt)) ||
      (await tryGroq(message, history, systemPrompt));

    if (!reply) {
      return res.status(500).json({ error: "All AI failed" });
    }

    const viralScore = calculateViralScore(reply);

    res.json({
      reply,
      plan,
      viralScore,
      memory: userMemory
    });

  } catch (err) {
    console.error(err);
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
          maxOutputTokens: 1200,
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
      max_tokens: 1200
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
  console.log(`🚀 Xarvis V3 Operator running on ${PORT}`);
  console.log(`🔐 API Key: ${!!process.env.XARVIS_API_KEY}`);
  console.log(`🤖 Gemini: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`⚡ Groq: ${!!process.env.GROQ_API_KEY}`);
});
