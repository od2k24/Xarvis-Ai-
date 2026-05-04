console.log("🔥 NODE STARTED - FILE IS RUNNING");

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);

// ─────────────────────────────
// EXPRESS SETUP
// ─────────────────────────────
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

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

// Chat placeholder
app.post("/api/chat", (req, res) => {
  const { messages } = req.body || {};

  res.json({
    success: true,
    reply: "Backend is working. Next step: connect AI.",
    received: messages || null,
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
