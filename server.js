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
// Health Check (MOST IMPORTANT TEST)
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Xarvis backend is alive 🚀",
    time: new Date().toISOString()
  });
});

// ─────────────────────────────
// Simple test route
// ─────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢"
  });
});

// ─────────────────────────────
// Chat placeholder (NO AI YET — just test routing)
// ─────────────────────────────
app.post("/api/chat", (req, res) => {
  const { messages } = req.body || {};

  res.json({
    success: true,
    reply: "Backend is working. AI will be connected next step.",
    received: messages || null
  });
});

// ─────────────────────────────
// Root
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis API Running 🚀",
    endpoints: [
      "/api/health",
      "/api/ping",
      "/api/chat"
    ]
  });
});

// ─────────────────────────────
// Start Server
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
