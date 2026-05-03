console.log("🔥 NODE STARTED - FILE IS RUNNING");

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ─────────────────────────────
// ROOT
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis API running 🚀",
    time: new Date().toISOString()
  });
});

// ─────────────────────────────
// HEALTH CHECK
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version
  });
});

// ─────────────────────────────
// PING TEST
// ─────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢"
  });
});

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
  console.log("🚀 SERVER RUNNING ON PORT:", PORT);
});
