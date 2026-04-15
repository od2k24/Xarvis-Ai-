require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// BASIC SETUP
// ============================================================
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status: 'Xarvis AI Backend Running 🚀',
    time: new Date().toISOString()
  });
});

// ============================================================
// AUTH SYSTEM
// ============================================================
const API_KEY = process.env.XARVIS_API_KEY || 'dev-key';

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key || key !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  next();
}

// ============================================================
// RATE LIMIT (SIMPLE SAFE VERSION)
// ============================================================
const rateMap = new Map();
const LIMIT = 25;

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const today = new Date().toDateString();

  const data = rateMap.get(ip);

  if (!data || data.date !== today) {
    rateMap.set(ip, { date: today, count: 1 });
    return next();
  }

  if (data.count >= LIMIT) {
    return res.status(429).json({
      error: 'Rate limit reached'
    });
  }

  data.count++;
  next();
}

// cleanup memory daily
setInterval(() => {
  const today = new Date().toDateString();

  for (const [ip, data] of rateMap.entries()) {
    if (data.date !== today) rateMap.delete(ip);
  }
}, 60 * 60 * 1000);

// ============================================================
// SIMPLE MEMORY (SAFETY VERSION)
// ============================================================
const memory = new Map();

// ============================================================
// AI CALLS
// ============================================================
async function callGemini(message) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch (err) {
    return null;
  }
}

async function callGroq(message) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: message }
        ]
      })
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;

  } catch (err) {
    return null;
  }
}

// ============================================================
// MAIN CHAT ENDPOINT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'No message provided'
      });
    }

    const ip = req.headers['x-forwarded-for'] || req.ip;

    // init memory
    if (!memory.has(ip)) {
      memory.set(ip, {
        messages: [],
        niche: null
      });
    }

    const user = memory.get(ip);

    user.messages.push(message);
    user.messages = user.messages.slice(-10);

    const lower = message.toLowerCase();

    if (lower.includes('youtube')) user.niche = 'youtube';
    if (lower.includes('fitness')) user.niche = 'fitness';
    if (lower.includes('money')) user.niche = 'business';

    const prompt = `
You are Xarvis AI.

User message:
${message}

User niche:
${user.niche || 'unknown'}

Give:
- clear answer
- step by step execution
- no fluff
`;

    console.log("📩", message);

    let reply =
      await callGemini(prompt) ||
      await callGroq(prompt);

    if (!reply) {
      return res.status(500).json({
        error: 'All AI providers failed'
      });
    }

    res.json({
      reply,
      memory: user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
