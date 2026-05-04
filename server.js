console.log("🔥 NODE STARTED - FILE IS RUNNING");

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);

// ─────────────────────────────
// Express Server
// ─────────────────────────────
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Root test route
// ─────────────────────────────
// ROOT
// ─────────────────────────────
app.get("/", (req, res) => {
  res.send("Xarvis server is alive 🚀");
  res.json({
    status: "Xarvis API running 🚀",
    time: new Date().toISOString()
  });
});

// Health check
// ─────────────────────────────
// HEALTH CHECK
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "server running",
    time: new Date().toISOString()
    uptime: process.uptime(),
    node: process.version
  });
});

// Simple ping
// ─────────────────────────────
// PING TEST
// ─────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢"
  });
});

// Start server
// ─────────────────────────────
// CHAT (placeholder for now)
// ─────────────────────────────
app.post("/api/chat", (req, res) => {
  const { messages } = req.body || {};

  res.json({
    success: true,
    reply: "Backend is working. Next step: connect AI.",
    received: messages || null
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log("🚀 EXPRESS SERVER STARTED ON PORT:", PORT);
  console.log("🚀 SERVER RUNNING ON PORT:", PORT);
});
