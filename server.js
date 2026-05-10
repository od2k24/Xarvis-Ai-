import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─── MIDDLEWARE ─────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── RATE LIMIT (basic protection) ──────────────────────────
const requestCounts = new Map();

const rateLimit = (req, res, next) => {
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
};

app.use(rateLimit);

// ─── GROQ CLIENT ───────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── SYSTEM PROMPT ──────────────────────────────────────────
const SYSTEM_PROMPT = `
You are Xarvis AI — a world-class AI co-founder for content creators.
You specialise in viral content strategy, YouTube growth, hooks, scripts, monetisation,
and content planning. Be direct, actionable, and high-energy.
`;

// ─── TIMEOUT HELPER ─────────────────────────────────────────
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), ms)
  );

// ─── GROQ WRAPPER ───────────────────────────────────────────
async function askGroq(messages, max_tokens = 1200) {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

  const completion = await Promise.race([
    groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens,
      temperature: 0.85,
    }),
    timeout(15000),
  ]);

  return completion?.choices?.[0]?.message?.content ?? "";
}

// ─── HEALTH CHECK ───────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Xarvis AI running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "online" });
});

// ─── CHAT ENDPOINT ──────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], context = "" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const msgs = [
      ...(context
        ? [
            {
              role: "user",
              content: `Creator context: ${context}`,
            },
            {
              role: "assistant",
              content: "Got it — tailoring response.",
            },
          ]
        : []),
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await askGroq(msgs, 900);
    res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    res.status(500).json({ error: "AI temporarily unavailable" });
  }
});

// ─── GENERATE ENDPOINT ──────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, platform, content, goal, context = "" } = req.body;

    let prompt = "";

    if (type === "viral") {
      prompt = `Generate viral content for: "${topic}" on ${platform || "YouTube Shorts"}
${context}
Format:
HOOK:
SCRIPT:
TITLE:
THUMBNAIL:`;

    } else if (type === "postnext") {
      prompt = `Suggest the next viral video idea:
${context}
Format:
IDEA:
HOOK:
WHY IT WORKS:
BEST TIME TO POST:`;

    } else if (type === "calendar") {
      prompt = `Create 7-day content plan:
${context}
Format 7 lines:
DAY | TOPIC | ANGLE | HOOK`;

    } else if (type === "feedback") {
      prompt = `Analyse content:
"${content}"
${context}
Format:
STRENGTHS:
WEAKNESSES:
IMPROVEMENTS:
VIRAL SCORE:
VERDICT:`;

    } else if (type === "agent") {
      prompt = `Build execution roadmap for goal:
"${goal}"
${context}
Include:
Phases
Daily actions
Content strategy
Monetisation
Metrics`;
    } else {
      return res.status(400).json({ error: "Unknown type" });
    }

    const reply = await askGroq([{ role: "user", content: prompt }], 1400);
    res.json({ reply });
  } catch (err) {
    console.error("GENERATE ERROR:", err.message);
    res.status(500).json({ error: "Generation failed" });
  }
});

// ─── START SERVER ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI server running on port ${PORT}`);
});
