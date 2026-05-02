require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoute = require("./routes/chat");
const generateRoute = require("./routes/generate");
const healthRoute = require("./routes/health");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRoute);
app.use("/api/generate", generateRoute);
app.use("/api/health", healthRoute);

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
