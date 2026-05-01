const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ Fetch fix (works on all Node versions)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "- Give actionable steps",
    "- Be concise",
    "- Focus on making money and growth",
    goal ? `User goal: ${goal}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nativeFetch: typeof fetch !== "undefined",
  });
});

// ─────────────────────────────────────────────
// Chat Route (FIXED + CLEAN)
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Missing GROQ_API_KEY in environment" });
  }

  const { messages = [], goal } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "messages must be a non-empty array",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(goal) },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || "Groq API error",
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res
        .status(502)
        .json({ error: "Empty response from Groq" });
    }

    return res.json({ reply });
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out" });
    }

    return res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

// ─────────────────────────────────────────────
// Static Frontend (GitHub / Railway safe)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`Node: ${process.version}`);
});
