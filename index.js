require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoute     = require("./routes/chat");
const generateRoute = require("./routes/generate");
const agentRoute    = require("./routes/agent");
const healthRoute   = require("./routes/health");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/chat",     chatRoute);     // POST /api/chat/stream
app.use("/api/generate", generateRoute); // POST /api/generate
app.use("/api/agent",    agentRoute);    // POST /api/agent/plan
app.use("/api/health",   healthRoute);   // GET  /api/health

app.get("/", (_req, res) => {
  res.json({
    status: "Xarvis API is running 🚀",
    endpoints: ["/api/health", "/api/chat/stream", "/api/generate", "/api/agent/plan"],
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`✅ Xarvis AI server running on http://localhost:${PORT}`);
  console.log(`   GROQ_API_KEY loaded: ${!!process.env.GROQ_API_KEY}`);
});
