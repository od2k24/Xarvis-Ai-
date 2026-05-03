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
app.get("/", (req, res) => {
  res.send("Xarvis server is alive 🚀");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "server running",
    time: new Date().toISOString()
  });
});

// Simple ping
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢"
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 EXPRESS SERVER STARTED ON PORT:", PORT);
});
