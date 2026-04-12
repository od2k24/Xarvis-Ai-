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
app.options('*', cors());
app.use(express.json());

// ============================================================
// AUTH MIDDLEWARE
// Secret key your frontend will send with every request.
// Set XARVIS_API_KEY in Railway environment variables.
// ============================================================
const XARVIS_API_KEY = process.env.XARVIS_API_KEY || 'xarvis-dev-key-change-me';

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== XARVIS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ============================================================
// RATE LIMITER (in-memory — resets on server restart)
// Tracks requests per IP per day.
// ============================================================
const rateLimits = new Map(); // ip -> { count, date }

const PLAN_LIMITS = {
  starter: 10,
  pro: Infinity,
  elite: Infinity,
};

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const plan = req.body?.plan || 'starter';
  const limit = PLAN_LIMITS[plan] ?? 10;

  if (limit === Infinity) return next(); // paid plans skip rate limit

  const today = new Date().toDateString();
  const record = rateLimits.get(ip);

  if (!record || record.date !== today) {
    rateLimits.set(ip, { count: 1, date: today });
    return next();
  }

  if (record.count >= limit) {
    return res.status(429).json({
      error: 'Daily message limit reached',
      limit,
      plan,
      upgradeRequired: true,
    });
  }

  record.count++;
  next();
}

// Clean up old IPs every hour to prevent memory leak
setInterval(() => {
  const today = new Date().toDateString();
  for (const [ip, record] of rateLimits.entries()) {
    if (record.date !== today) rateLimits.delete(ip);
  }
}, 60 * 60 * 1000);

// ============================================================
// HEALTH CHECK (no auth needed)
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status: 'Xarvis AI backend is running ✅',
    timestamp: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      authKey: !!process.env.XARVIS_API_KEY,
    }
  });
});

// ============================================================
// CHAT ENDPOINT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  const { message, history = [], systemPrompt, plan = 'starter' } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Try Gemini first, fall back to Groq
  const reply = await tryGemini(message, history, systemPrompt)
    .catch(() => tryGroq(message, history, systemPrompt));

  if (!reply) {
    return res.status(500).json({ error: 'All AI providers failed. Check API keys in Railway.' });
  }

  res.json({ reply, plan });
});

// ============================================================
// GEMINI
// ============================================================
async function tryGemini(message, history, systemPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini key');

  const contents = [];
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  const defaultPrompt = 'You are Xarvis Creator AI — an elite AI co-founder for content creators. Be direct, actionable, and focused on viral growth and monetization. No fluff.';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt || defaultPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.8 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Gemini ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ============================================================
// GROQ FALLBACK
// ============================================================
async function tryGroq(message, history, systemPrompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No Groq key');

  const defaultPrompt = 'You are Xarvis Creator AI — an elite AI co-founder for content creators. Be direct, actionable, and focused on viral growth and monetization. No fluff.';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt || defaultPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Xarvis AI backend running on port ${PORT}`);
  console.log(`   Gemini key: ${process.env.GEMINI_API_KEY ? '✅ set' : '❌ MISSING'}`);
  console.log(`   Groq key:   ${process.env.GROQ_API_KEY ? '✅ set' : '❌ MISSING'}`);
  console.log(`   Auth key:   ${process.env.XARVIS_API_KEY ? '✅ set' : '⚠️  using dev default'}`);
});
