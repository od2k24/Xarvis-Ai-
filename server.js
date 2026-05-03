const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// STEP 1: PROOF THIS FILE IS RUNNING
// ─────────────────────────────
console.log("🔥 SERVER LOADED: server.js is active");

// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────
// ROOT
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis backend running 🚀",
    message: "Server is alive",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/health",
      "/api/ping",
      "/api/chat"
    ]
  });
});

// ─────────────────────────────
// STEP 2: HEALTH CHECK (MUST WORK)
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Health check passed",
    node: process.version,
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────
// STEP 3: SIMPLE PING TEST
// ─────────────────────────────
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢",
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────
// STEP 4: CHAT (NO AI YET — JUST TEST ROUTING)
// ─────────────────────────────
app.post("/api/chat", (req, res) => {
  const { messages } = req.body || {};

  res.json({
    success: true,
    message: "Chat route is working",
    received: messages || null,
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────
// STEP 5: 404 DEBUG (IMPORTANT)
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    hint: "Server is running but route does not exist",
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node version: ${process.version}`);
});
