import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// CONFIG
// ============================================================
const XARVIS_API_KEY = process.env.XARVIS_API_KEY || 'xarvis-dev-key-change-me';

const PLAN_LIMITS = {
  starter: 10,
  pro: Infinity,
  elite: Infinity,
};

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: '*', // lock later
}));
app.use(express.json());

// ============================================================
// LOGGER (OPERATOR VIEW)
// ============================================================
function logRequest(req, status = 'OK') {
  console.log(`[${new Date().toISOString()}] ${req.ip} | ${req.body?.plan || 'starter'} | ${status}`);
}

// ============================================================
// AUTH
// ============================================================
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key || key !== XARVIS_API_KEY) {
    logRequest(req, 'UNAUTHORIZED');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// ============================================================
// RATE LIMIT
// ============================================================
const rateLimits = new Map();

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  const plan = req.body?.plan || 'starter';
  const limit = PLAN_LIMITS[plan] ?? 10;

  if (limit === Infinity) return next();

  const today = new Date().toDateString();
  const record = rateLimits.get(ip);

  if (!record || record.date !== today) {
    rateLimits.set(ip, { count: 1, date: today });
    return next();
  }

  if (record.count >= limit) {
    logRequest(req, 'LIMIT HIT');
    return res.status(429).json({
      error: 'Daily limit reached',
      upgradeRequired: true
    });
  }

  record.count++;
  next();
}

// ============================================================
// HEALTH
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status: 'Xarvis Operator Backend Running',
    time: new Date().toISOString()
  });
});

// ============================================================
// CHAT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  const { message, history = [], systemPrompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message' });
  }

  try {
    const reply =
      await tryGemini(message, history, systemPrompt)
      .catch(() => tryGroq(message, history, systemPrompt));

    if (!reply) throw new Error('No AI response');

    logRequest(req, 'SUCCESS');

    res.json({ reply });

  } catch (err) {
    console.error('AI ERROR:', err.message);
    logRequest(req, 'ERROR');

    res.status(500).json({
      error: 'AI failed'
    });
  }
});

// ============================================================
// GEMINI
// ============================================================
async function tryGemini(message, history, systemPrompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('No Gemini');

  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt || 'Be a high-performance creator AI' }]
        },
        contents
      })
    }
  );

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// ============================================================
// GROQ FALLBACK
// ============================================================
async function tryGroq(message, history, systemPrompt) {
  if (!process.env.GROQ_API_KEY) throw new Error('No Groq');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt || '' },
        ...history,
        { role: 'user', content: message }
      ]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Xarvis Operator running on ${PORT}`);
});
