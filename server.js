const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────
// Root Route (FIXED - prevents Not Found confusion)
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis backend running 🚀",
    endpoints: ["/api/health", "/api/chat"],
  });
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "Give actionable steps.",
    "Be concise and high-impact.",
    "Focus on business, growth, and execution.",
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

// ─────────────────────────────────────────────
// Chat Route (MAIN AI ENGINE)
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    // ❌ Missing API key
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY in environment variables",
      });
    }

    // ❌ Invalid messages
    if (!isValidMessages(messages)) {
      return res.status(400).json({
        error: "Invalid messages format",
      });
    }

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
    console.error("Server error:", err);

    return res.status(500).json({
      error:
        err.name === "AbortError"
          ? "Request timed out"
          : "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────
// Static frontend (optional)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
