@@ -1,75 +1,292 @@
require('dotenv').config();

const express = require('express');
const cors = require('cors');
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------- CORS ----------------
// ============================================================
// CORS (same as your old system)
// CORS
// ============================================================
app.use(cors({
  origin: '*'
}));

  origin: [
@@ -22,7 +22,7 @@
app.use(express.json());

// ---------------- HEALTH ----------------
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis Stable Running 🚀' });
});
// ============================================================
// AUTH (UNCHANGED)
// AUTH
// ============================================================
const API_KEY = process.env.XARVIS_API_KEY || 'xarvis-dev-key-change-me';

// ---------------- AUTH ----------------
const API_KEY = process.env.XARVIS_API_KEY || 'dev-key';
@@ -35,7 +35,7 @@
}

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
// ============================================================
// RATE LIMIT (UNCHANGED CORE IDEA)
// RATE LIMIT
// ============================================================
const rateMap = new Map();

@@ -80,145 +80,145 @@
}, 60 * 60 * 1000);

// ============================================================
// 🧠 REAL MEMORY SYSTEM (UPGRADED)
// 🧠 MEMORY (IMPROVED)
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
// 🔥 VIRAL SCORE (UPGRADED)
// ============================================================
function calculateViralScore(text) {
  let score = 50;

  const hooks = ["you won't believe", "this changed", "no one tells you", "secret", "stop doing"];
  const hasHook = hooks.some(h => text.toLowerCase().includes(h));
  if (hasHook) score += 15;

  if (text.includes("?")) score += 5;
  if (text.length < 200) score += 10;
  if (text.includes("🔥") || text.includes("viral")) score += 10;
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
// 🧠 MULTI-AGENT OPERATOR BRAIN
// 🧠 AI CALL WRAPPER (SMART FALLBACK)
// ============================================================
function operatorBrain(message, plan, memory) {
async function callAI(message, history, systemPrompt) {
  return (
    await tryGemini(message, history, systemPrompt)
  ) || (
    await tryGroq(message, history, systemPrompt)
  );
}

// ---------------- SIMPLE MEMORY ----------------
const memory = new Map();
  const base = `
You are Xarvis AI — an elite CREATOR OPERATING SYSTEM.
// ============================================================
// 🧠 REAL MULTI-AGENT SYSTEM
// ============================================================
async function runAgents(message, history, memory, plan) {

You are NOT a chatbot.
  const context = `
User message: ${message}
Niche: ${memory?.niche || "unknown"}
Goals: ${memory?.goals || "unknown"}
`;

You act like a:
- YouTube growth operator
- Content strategist
- Monetization engineer
  // Run in parallel (FASTER)
  const [strategy, viral, money] = await Promise.all([

You optimize for:
→ Views
→ Followers
→ Revenue
    callAI(
      context + "\nCreate a growth strategy.",
      history,
      "You are a YouTube growth strategist."
    ),

`;
    callAI(
      context + "\nCreate 3 viral hooks.",
      history,
      "You are a viral content expert."
    ),

// ---------------- CHAT ----------------
app.post('/api/chat', requireAuth, async (req, res) => {
  const agentLayer = `
You run 3 internal thinking agents:
    callAI(
      context + "\nExplain how to monetize this.",
      history,
      "You are a monetization expert."
    )

1. STRATEGIST AI → plans growth path
2. VIRAL ENGINE → creates hooks & viral ideas
3. MONETIZATION AI → turns views into money
  ]);

You combine all 3 into ONE answer.
`;

  const outputFormat = `
  return `
🔥 GOAL
${message}

⚡ STRATEGY
🧠 EXECUTION (step-by-step)
🎯 EXACT OUTPUT (script/hook/content)
💰 MONETIZATION ANGLE
🚀 VIRAL EDGE
`;
${strategy}

  const planBoost =
    plan === "elite"
      ? "User is ELITE → give business-level scaling systems, funnels, automation."
      : plan === "pro"
      ? "User is PRO → give advanced creator monetization + systems."
      : "User is STARTER → keep simple but high impact, push upgrade naturally.";
🎯 VIRAL IDEAS
${viral}

  const memoryBlock = `
USER MEMORY:
Niche: ${memory?.niche || "unknown"}
Goals: ${memory?.goals || "unknown"}
`;
💰 MONETIZATION
${money}

  return base + agentLayer + planBoost + memoryBlock + outputFormat;
🚀 EDGE
This combines strategy + virality + monetization → maximizes growth + revenue.
`;
}

// ============================================================
// HEALTH
// ============================================================
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis V3 Operator Running 🚀' });
  res.json({ status: 'Xarvis V3.5 Running 🚀' });
});

// ============================================================
// MAIN CHAT ENDPOINT (UPGRADED CORE)
// CHAT ENDPOINT
// ============================================================
app.post('/api/chat', requireAuth, rateLimit, async (req, res) => {
  try {
    const { message } = req.body;
    const { message, history = [], plan = "starter" } = req.body;

    if (!message) return res.status(400).json({ error: "No message" });
    if (!message) {
      return res.status(400).json({ error: 'No message' });
      return res.status(400).json({ error: "No message" });
    }

    const ip = req.ip;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    if (!memory.has(ip)) {
      memory.set(ip, { messages: [] });
    // init memory
    // Init memory
    if (!memoryStore.has(ip)) {
      memoryStore.set(ip, {
        messages: [],
        niche: null,
        goals: null,
        strategyProfile: null
        goals: null
      });
    }

    const user = memory.get(ip);
    user.messages.push(message);
    user.messages = user.messages.slice(-10);
    const userMemory = memoryStore.get(ip);

    const reply = `
🔥 Xarvis Response
    // update memory (simple intelligence)
    // Update memory
    userMemory.messages.push(message);
    userMemory.messages = userMemory.messages.slice(-25);

You said: ${message}
    if (message.toLowerCase().includes("fitness")) userMemory.niche = "fitness";
    if (message.toLowerCase().includes("youtube")) userMemory.niche = "youtube";
    const lower = message.toLowerCase();

🧠 Step 1: Focus on clarity  
⚡ Step 2: Execute daily  
🚀 Step 3: Stay consistent  
`;
    const systemPrompt = operatorBrain(message, plan, userMemory);
    if (lower.includes("fitness")) userMemory.niche = "fitness";
    if (lower.includes("youtube")) userMemory.niche = "youtube";
    if (lower.includes("money")) userMemory.goals = "make money";
    if (lower.includes("grow")) userMemory.goals = "growth";

    console.log("📩 MSG:", message);
    console.log("📊 PLAN:", plan);
    console.log("🧠 MEMORY:", userMemory);

    res.json({ reply });
    // 🔥 Try AI engines
    const reply =
      (await tryGemini(message, history, systemPrompt)) ||
      (await tryGroq(message, history, systemPrompt));

    if (!reply) {
      return res.status(500).json({ error: "All AI failed" });
    }
    // 🧠 RUN AGENTS
    const reply = await runAgents(message, history, userMemory, plan);

    const viralScore = calculateViralScore(reply);

@@ -230,7 +230,7 @@
    });

  } catch (err) {
    console.error(err);
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
@@ -258,7 +258,7 @@
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1200,
          maxOutputTokens: 1000,
          temperature: 0.8
        }
      })
@@ -291,7 +291,7 @@
        ...history,
        { role: "user", content: message }
      ],
      max_tokens: 1200
      max_tokens: 1000
    })
  });

// ---------------- START ----------------
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
@@ -305,7 +305,7 @@
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Xarvis V3 Operator running on ${PORT}`);
  console.log(`🚀 Xarvis V3.5 running on ${PORT}`);
  console.log(`🔐 API Key: ${!!process.env.XARVIS_API_KEY}`);
  console.log(`🤖 Gemini: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`⚡ Groq: ${!!process.env.GROQ_API_KEY}`);
