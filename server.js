console.log("🔥 NODE STARTED - FILE IS RUNNING");

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);

// ─────────────────────────────
// IMPORTS
// ─────────────────────────────
const express = require("express");
const cors = require("cors");

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

// request logger
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
    status: "Xarvis API running 🚀",
    time: new Date().toISOString(),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "server running",
    time: new Date().toISOString(),
    uptime: process.uptime(),
    node: process.version,
  });
});

// Ping test
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢",
  });
});

// ─────────────────────────────
// CHAT API (FIXED)
// ─────────────────────────────
app.post("/api/chat", (req, res) => {
  try {
    const { message, messages, history, context } = req.body || {};

    console.log("📨 Incoming body:", req.body);

    // Normalize all possible formats into one
    const chatHistory = messages || history || [];

    // Validation (flexible)
    if (!message && chatHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No message or history provided",
      });
    }

    return res.json({
      success: true,
      reply: "Backend is connected properly 🚀",
      debug: {
        message: message || null,
        history: chatHistory,
        context: context || null,
      },
    });
  } catch (err) {
    console.error("❌ Chat error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ─────────────────────────────
// 404 HANDLER
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// ─────────────────────────────
// ERROR HANDLER
// ─────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(500).json({
    success: false,
    error: "Something broke on server",
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
