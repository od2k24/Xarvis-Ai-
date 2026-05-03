const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ─────────────────────────────
// App Init
// ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(helmet());

app.use(cors({
  origin: "*", // change later for production frontend
}));

app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// ─────────────────────────────
// Config
// ─────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────
// Utils
// ─────────────────────────────
const now = () => new Date().toISOString();

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

function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every((m) => m.role && m.content)
  );
}

// ─────────────────────────────
// Routes
// ─────────────────────────────

// Root
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis API running 🚀",
    timestamp: now(),
    endpoints: ["/api/health", "/api/chat"],
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    timestamp: now(),
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing GROQ_API_KEY",
      });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({
        success: false,
        error: "Invalid messages format",
      });
    }

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
        success: false,
        error: data?.error?.message || "Groq API error",
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty response from model",
      });
    }

    return res.json({
      success: true,
      reply,
      timestamp: now(),
    });
  } catch (err) {
    console.error("🔥 Server error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: now(),
    });
  }
});

// ─────────────────────────────
// 404 Handler
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    timestamp: now(),
  });
});

// ─────────────────────────────
// Start Server
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
