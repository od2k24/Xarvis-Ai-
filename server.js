const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nodeVersion: process.version,
    nativeFetch: typeof fetch !== "undefined",
  });
});

// ─── Shared Groq caller ───────────────────────────────────────────────────────
async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  if (typeof fetch === "undefined") throw new Error("Native fetch unavailable — use Node 18+");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let res;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.8, max_tokens: 1024 }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("Groq timed out");
    throw new Error(`Network error: ${err.message}`);
  }

  clearTimeout(timeoutId);

  let data;
  try { data = await res.json(); } catch { throw new Error("Groq returned non-JSON"); }
  if (!res.ok) throw new Error(`Groq ${res.status}: ${data?.error?.message || "unknown"}`);

  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Groq returned empty content");
  return reply;
}

// ─── /api/chat  (AI Advisor chat) ────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  console.log("📩 /api/chat body keys:", Object.keys(req.body || {}));

  // Frontend sends: { message, context, history }
  const { message, context = "", history = [] } = req.body ?? {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message field is required and must be a non-empty string" });
  }

  const systemPrompt = [
    "You are Xarvis — an elite AI co-founder for content creators.",
    "Give actionable, specific advice. Be concise and direct.",
    "Focus on growth, virality, and monetization.",
    context || "",
  ].filter(Boolean).join("\n");

  // Rebuild full message array: system + history + new message
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    { role: "user", content: message.trim() },
  ];

  try {
    const reply = await callGroq(messages);
    console.log(`✅ /api/chat reply (${reply.length} chars)`);
    return res.json({ reply });
  } catch (err) {
    console.error("❌ /api/chat error:", err.message);
    return res.status(502).json({ error: err.message });
  }
});

// ─── /api/generate  (Viral, PostNext, Calendar, Feedback) ────────────────────
const GENERATE_PROMPTS = {
  viral: ({ topic, platform, context }) => ({
    system: `You are Xarvis, a viral content strategist. Generate content packages with EXACTLY this format — no extra text:\nHOOK: <hook>\nSCRIPT: <script>\nTITLE: <titles>\nTHUMBNAIL: <concept>\nXARVIS_END${context || ""}`,
    user: `Create a viral ${platform} content package for: "${topic}"`,
  }),

  postnext: ({ context, memory }) => ({
    system: `You are Xarvis. Recommend ONE high-potential post idea using EXACTLY this format:\nIDEA: <idea>\nHOOK: <hook>\nWHY IT WILL WORK: <reason>\nBEST TIME TO POST: <timing>${context || ""}`,
    user: `Based on my creator profile, what ONE video should I post today for maximum growth? Niche: ${memory?.niche || "general"}`,
  }),

  calendar: ({ context, memory }) => ({
    system: `You are Xarvis. Generate a 7-day content calendar. Use EXACTLY this pipe-delimited format, one day per line:\nDAY 1 | Topic Title | Unique angle/approach | "Hook sentence"\nDAY 2 | Topic Title | Unique angle/approach | "Hook sentence"\n...through DAY 7. No other text.${context || ""}`,
    user: `Build a 7-day content calendar for a ${memory?.niche || "general"} creator on ${memory?.platform || "YouTube Shorts"}.`,
  }),

  feedback: ({ content, context, memory }) => ({
    system: `You are Xarvis, a brutal but constructive content strategist. Use EXACTLY this format:\nSTRENGTHS: <strengths>\nWEAKNESSES: <weaknesses>\nIMPROVEMENTS: <improvements>\nVIRAL SCORE: <N>/10\nVERDICT: <one sentence summary>${context || ""}`,
    user: `Analyze this content idea and score its viral potential: "${content}"`,
  }),
};

app.post("/api/generate", async (req, res) => {
  console.log("📩 /api/generate type:", req.body?.type);

  const { type, ...rest } = req.body ?? {};
  if (!type || !GENERATE_PROMPTS[type]) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${Object.keys(GENERATE_PROMPTS).join(", ")}` });
  }

  const { system, user } = GENERATE_PROMPTS[type](rest);
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    const reply = await callGroq(messages);
    console.log(`✅ /api/generate [${type}] reply (${reply.length} chars)`);
    return res.json({ reply });
  } catch (err) {
    console.error(`❌ /api/generate [${type}] error:`, err.message);
    return res.status(502).json({ error: err.message });
  }
});

// ─── Static & Fallback ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT} | Node ${process.version}`);
});
