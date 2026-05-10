import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─────────────────────────────────────────────
// CORS (FIXED FOR GITHUB PAGES)
// ─────────────────────────────────────────────
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// handle preflight explicitly (IMPORTANT)
app.options("*", cors());

app.use(express.json());

// ─────────────────────────────────────────────
// RATE LIMIT
// ─────────────────────────────────────────────
const requestCounts = new Map();

app.use((req, res, next) => {
  const ip = req.ip || "unknown";
  const now = Date.now();

  const data = requestCounts.get(ip) || { count: 0, time: now };

  if (now - data.time > 60000) {
    data.count = 0;
    data.time = now;
  }

  data.count++;

  if (data.count > 30) {
    return res.status(429).json({ error: "Too many requests" });
  }

  requestCounts.set(ip, data);
  next();
});

// ─────────────────────────────────────────────
// GROQ
// ─────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are Xarvis AI — a world-class AI co-founder for creators.
Be direct, actionable, and high-energy.
`;

async function askGroq(messages, max_tokens = 1200) {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ],
    max_tokens,
    temperature: 0.85,
  });

  return completion?.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Xarvis AI running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    const reply = await askGroq([
      ...history.slice(-10),
      { role: "user", content: message }
    ], 900);

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});

// ─────────────────────────────────────────────
// STREAM CHAT (FIX FOR YOUR FRONTEND)
// ─────────────────────────────────────────────
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { message } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reply = await askGroq([{ role: "user", content: message }], 900);

    // simulate streaming
    for (let i = 0; i < reply.length; i++) {
      res.write(`data: ${JSON.stringify({
        type: "delta",
        content: reply[i]
      })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
  }
});

// ─────────────────────────────────────────────
// GENERATE
// ─────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, platform, content, goal } = req.body;

    let prompt = "";

    if (type === "viral") {
      prompt = `Create viral content for: ${topic} on ${platform}`;
    }

    if (type === "postnext") {
      prompt = `Next viral idea for creator niche: ${topic}`;
    }

    if (type === "calendar") {
      prompt = `7-day content calendar for: ${topic}`;
    }

    if (type === "feedback") {
      prompt = `Analyse this content: ${content}`;
    }

    if (type === "agent") {
      prompt = `Build execution plan for: ${goal}`;
    }

    const reply = await askGroq([{ role: "user", content: prompt }], 1400);

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on ${PORT}`);
});
