const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─────────────────────────────────────────
// GROQ CONFIG
// ─────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────
// HEALTH CHECK (IMPORTANT FOR DEPLOY DEBUG)
// ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    uptime: process.uptime(),
  });
});

// ─────────────────────────────────────────
// GROQ FUNCTION
// ─────────────────────────────────────────
async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Groq API error");
  }

  return data?.choices?.[0]?.message?.content;
}

// ─────────────────────────────────────────
// CHAT ROUTE (MAIN)
// ─────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], context = "" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const systemPrompt = `
You are Xarvis — an elite AI co-founder for creators.

Rules:
- Be short and actionable
- Focus on growth, monetization, virality
- No fluff
${context}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await callGroq(messages);

    return res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

// ─────────────────────────────────────────
// GENERATE ROUTE
// ─────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, platform, content, context = "", memory = {} } = req.body;

    let system = "";
    let user = "";

    if (type === "viral") {
      system = `Return EXACT format:
HOOK:
SCRIPT:
TITLE:
THUMBNAIL:`;
      user = `Create viral ${platform} content for: ${topic}`;
    }

    else if (type === "postnext") {
      system = `Return:
IDEA:
HOOK:
WHY:
BEST TIME:`;
      user = `Best next post for niche: ${memory.niche || "general"}`;
    }

    else if (type === "calendar") {
      system = `Return 7 lines:
DAY | TOPIC | ANGLE | HOOK`;
      user = `7-day plan for ${memory.platform || "YouTube"}`;
    }

    else if (type === "feedback") {
      system = `Return:
STRENGTHS:
WEAKNESSES:
IMPROVEMENTS:
SCORE:
VERDICT:`;
      user = `Analyze: ${content}`;
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const reply = await callGroq([
      { role: "system", content: system + "\n" + context },
      { role: "user", content: user },
    ]);

    return res.json({ reply });
  } catch (err) {
    console.error("GENERATE ERROR:", err.message);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

// ─────────────────────────────────────────
// STATIC FRONTEND (IMPORTANT FOR GITHUB/Railway)
// ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────
// START SERVER (CLEAN)
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
