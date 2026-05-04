console.log("🔥 NODE STARTED - FILE IS RUNNING");

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);

// ─────────────────────────────
// IMPORTS
// ─────────────────────────────
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

// ─────────────────────────────
// GROQ SETUP (Railway env variable)
// ─────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────
// APP SETUP
// ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// MIDDLEWARE
// ─────────────────────────────
app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────
// ROUTES
// ─────────────────────────────

// Root
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis AI API running 🚀",
    time: new Date().toISOString(),
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version,
  });
});

// Ping
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢",
  });
});

// ─────────────────────────────
// CHAT (REAL GROQ AI)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages, history, context } = req.body || {};

    console.log("📨 Incoming body:", req.body);

    const chatHistory = messages || history || [];

    if (!message && chatHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No message provided",
      });
    }

    const formattedMessages = [
      {
        role: "system",
        content: `You are Xarvis AI. Be smart, helpful, and concise. Context: ${context || "none"}`,
      },
      ...chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: formattedMessages,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    return res.json({
      success: true,
      reply,
    });

  } catch (err) {
    console.error("❌ AI ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "AI request failed",
    });
  }
});

// ─────────────────────────────
// 404
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
