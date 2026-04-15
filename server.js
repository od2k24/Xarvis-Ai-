@@ -1,132 +1,227 @@
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
require('dotenv').config();

dotenv.config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================
// SAFETY MIDDLEWARE
// ==========================
app.use(cors());
// ============================================================
// BASIC SETUP
// ============================================================
app.use(cors({
  origin: [
    'https://od2k24.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

// ==========================
// HEALTH CHECK (RAILWAY NEEDS THIS)
// ==========================
app.get("/", (req, res) => {
// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status: "Xarvis is running 🚀",
    status: 'Xarvis Core Running 🚀',
    time: new Date().toISOString()
  });
});

// ==========================
// SIMPLE AUTH
// ==========================
const API_KEY = process.env.XARVIS_API_KEY;
// ============================================================
// AUTH (SIMPLE STANDARD)
// ============================================================
const API_KEY = process.env.XARVIS_API_KEY || 'dev-key';

function auth(req, res, next) {
  if (!API_KEY) return res.status(500).json({ error: "Missing API KEY" });
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  if (!key || key !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  next();
}

// ==========================
// SIMPLE MEMORY (SAFE)
// ==========================
const memory = new Map();
// ============================================================
// RATE LIMIT (BASIC SAFE VERSION)
// ============================================================
const rateMap = new Map();

const LIMIT = 20; // per IP per day

// ==========================
// VIRAL SCORE
// ==========================
function viralScore(text = "") {
  let score = 50;
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const today = new Date().toDateString();

  const t = text.toLowerCase();
  const record = rateMap.get(ip);

  if (t.includes("secret")) score += 10;
  if (t.includes("you")) score += 5;
  if (text.length < 300) score += 10;
  if (text.includes("?")) score += 5;
  if (!record || record.date !== today) {
    rateMap.set(ip, { date: today, count: 1 });
    return next();
  }

  if (record.count >= LIMIT) {
    return res.status(429).json({
      error: 'Rate limit reached'
    });
  }

  return Math.min(100, score);
  record.count++;
  next();
}

// ==========================
// SAFE RESPONSE ENGINE (NO CRASH AI)
// ==========================
function generateResponse(message, userMemory) {
  return `
🔥 GOAL
${message}
// cleanup old entries
setInterval(() => {
  const today = new Date().toDateString();
  for (const [ip, data] of rateMap.entries()) {
    if (data.date !== today) rateMap.delete(ip);
  }
}, 60 * 60 * 1000);

⚡ STRATEGY
Focus on high-impact content in your niche: ${userMemory.niche || "unknown"}
// ============================================================
// SIMPLE MEMORY (SAFE VERSION)
// ============================================================
const memory = new Map();

🧠 EXECUTION
1. Pick one strong idea
2. Turn it into short-form content
3. Post consistently
4. Improve based on feedback
// ============================================================
// AI CALLS (FALLBACK SYSTEM)
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
          contents: [{
            role: 'user',
            parts: [{ text: message }]
          }]
        })
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

🎯 OUTPUT
Create 3 viral versions of: "${message}"
  } catch (err) {
    return null;
  }
}

🚀 EDGE
Consistency + hooks = growth
`;
async function callGroq(message) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
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

// ==========================
// CHAT ENDPOINT
// ==========================
app.post("/api/chat", auth, (req, res) => {
// ============================================================
// MAIN CHAT ENDPOINT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  try {
    const { message } = req.body;
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
      return res.status(400).json({ error: 'No message provided' });
    }

    const ip = req.ip;
    const ip = req.headers['x-forwarded-for'] || req.ip;

    // memory init
    if (!memory.has(ip)) {
      memory.set(ip, { niche: null, messages: [] });
      memory.set(ip, {
        messages: [],
        niche: null
      });
    }

    const userMemory = memory.get(ip);

    userMemory.messages.push(message);
    userMemory.messages = userMemory.messages.slice(-20);
    userMemory.messages = userMemory.messages.slice(-10);

    if (message.toLowerCase().includes("youtube")) {
      userMemory.niche = "youtube";
    }
    // simple niche detection
    const lower = message.toLowerCase();
    if (lower.includes('youtube')) userMemory.niche = 'youtube';
    if (lower.includes('fitness')) userMemory.niche = 'fitness';

    const reply = generateResponse(message, userMemory);
    const prompt = `
You are Xarvis AI.

User message: ${message}

User niche: ${userMemory.niche || 'unknown'}

Give:
- clear answer
- actionable steps
- simple format
`;

    console.log("📩 Message:", message);

    // AI fallback chain
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
      viralScore: viralScore(reply),
      memory: userMemory
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crashed" });
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// START SERVER (RAILWAY SAFE)
// ==========================
// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🚀 Xarvis Core running on port ${PORT}`);
});
