const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── CONFIG ─────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── HEALTH CHECK ───────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nodeVersion: process.version,
  });
});

// ─── GROQ CALLER ────────────────────────────────────────
async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  if (typeof fetch === "undefined") throw new Error("Node 18+ required");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Groq error");

  return data?.choices?.[0]?.message?.content;
}

// ─── CHAT ROUTE ─────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], context = "" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const system = [
      "You are Xarvis — an elite AI co-founder for creators.",
      "Be concise, actionable, and focused on growth.",
      context,
    ].join("\n");

    const messages = [
      { role: "system", content: system },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await callGroq(messages);

    return res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GENERATE ROUTE ─────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, platform, content, context = "", memory = {} } = req.body;

    let system = "";
    let user = "";

    switch (type) {
      case "viral":
        system = `You are Xarvis viral strategist. Output strictly:
HOOK:
SCRIPT:
TITLE:
THUMBNAIL:`;
        user = `Create viral ${platform} content for: ${topic}`;
        break;

      case "postnext":
        system = `You are Xarvis. Suggest ONE viral idea:
IDEA:
HOOK:
WHY:
BEST TIME:`;
        user = `What should I post next? Niche: ${memory.niche || "general"}`;
        break;

      case "calendar":
        system = `Create 7-day content plan. Format:
DAY | TOPIC | ANGLE | HOOK`;
        user = `Make 7-day calendar for ${memory.platform || "YouTube"}`;
        break;

      case "feedback":
        system = `You are a strict content critic:
STRENGTHS:
WEAKNESSES:
IMPROVEMENTS:
SCORE:
VERDICT:`;
        user = `Analyze: ${content}`;
        break;

      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    const reply = await callGroq([
      { role: "system", content: system + "\n" + context },
      { role: "user", content: user },
    ]);

    return res.json({ reply });
  } catch (err) {
    console.error("GENERATE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── STATIC FRONTEND ────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── START SERVER ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
