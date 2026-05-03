const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─────────────────────────────
// Config
// ─────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────
// Helpers
// ─────────────────────────────
function now() {
  return new Date().toISOString();
}

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
// ROOT
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis backend running 🚀",
    timestamp: now(),
    endpoints: ["/api/health", "/api/chat"],
  });
});

// ─────────────────────────────
// HEALTH
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    timestamp: now(),
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// ─────────────────────────────
// CHAT (MAIN AI ENGINE)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing GROQ_API_KEY",
        timestamp: now(),
      });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({
        success: false,
        error: "Invalid messages format",
        timestamp: now(),
      });
    }

    // timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

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
      return res.status(500).json({
        success: false,
        error: data?.error?.message || "Groq API error",
        timestamp: now(),
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty response from model",
        timestamp: now(),
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
      error:
        err.name === "AbortError"
          ? "Request timed out"
          : "Internal server error",
      timestamp: now(),
    });
  }
});

// ─────────────────────────────
// OPTIONAL STATIC FRONTEND
// (safe version — no wildcard crash)
// ─────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("/app", (req, res) => {
  const filePath = path.join(__dirname, "public", "index.html");
  res.sendFile(filePath);
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─────────────────────────────
// Config
// ─────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────
// Helpers
// ─────────────────────────────
function now() {
  return new Date().toISOString();
}

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
// ROOT
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis backend running 🚀",
    timestamp: now(),
    endpoints: ["/api/health", "/api/chat"],
  });
});

// ─────────────────────────────
// HEALTH
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    timestamp: now(),
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// ─────────────────────────────
// CHAT (MAIN AI ENGINE)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing GROQ_API_KEY",
        timestamp: now(),
      });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({
        success: false,
        error: "Invalid messages format",
        timestamp: now(),
      });
    }

    // timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

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
      return res.status(500).json({
        success: false,
        error: data?.error?.message || "Groq API error",
        timestamp: now(),
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty response from model",
        timestamp: now(),
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
      error:
        err.name === "AbortError"
          ? "Request timed out"
          : "Internal server error",
      timestamp: now(),
    });
  }
});

// ─────────────────────────────
// OPTIONAL STATIC FRONTEND
// (safe version — no wildcard crash)
// ─────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("/app", (req, res) => {
  const filePath = path.join(__dirname, "public", "index.html");
  res.sendFile(filePath);
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
