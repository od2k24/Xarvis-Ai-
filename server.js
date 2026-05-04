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
app.use(cors()); // 🔥 fixes most "network error" issues
app.use(express.json());

// request logger (debugging)
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

// Chat API
app.post("/api/chat", (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!messages) {
      return res.status(400).json({
        success: false,
        error: "messages missing in request body",
      });
    }

    return res.json({
      success: true,
      reply: "Backend is working. Next step: connect AI.",
      received: messages,
    });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ─────────────────────────────
// 404 HANDLER (IMPORTANT)
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
