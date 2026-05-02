const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────
// Config
// ─────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────
// ROOT (no frontend, no crash)
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis API is running 🚀",
    endpoints: ["/api/health", "/api/chat"],
  });
});

// ─────────────────────────────
// HEALTH CHECK
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// ─────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────
function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "You help users build businesses, make money, and grow fast.",
    "Be direct, practical, and actionable.",
    goal ? `User goal: ${goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────
// VALIDATION
// ─────────────────────────────
function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every((m) => m.role && m.content)
  );
}

// ─────────────────────────────
// CHAT ROUTE (MAIN AI)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    // ❌ Missing API key
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY",
      });
    }

    // ❌ Invalid input
    if (!isValidMessages(messages)) {
      return res.status(400).json({
        error: "Invalid messages format",
      });
    }

    // ─────────────────────────────
    // Call Groq API
    // ─────────────────────────────
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
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Groq API error",
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "Empty response from model",
      });
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("🔥 Server error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
