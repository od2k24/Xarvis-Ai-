const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// ─────────────────────────────
// Middleware
// ─────────────────────────────────────────────
// ─────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// ─────────────────────────────
// Config
// ─────────────────────────────────────────────
// ─────────────────────────────
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────
// Root Route (FIXED - prevents Not Found confusion)
// ─────────────────────────────────────────────
// ─────────────────────────────
// ROOT (no frontend, no crash)
// ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis backend running 🚀",
    status: "Xarvis API is running 🚀",
    endpoints: ["/api/health", "/api/chat"],
  });
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
// ─────────────────────────────
// HEALTH CHECK
// ─────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
@@ -40,21 +39,23 @@ app.get("/api/health", (req, res) => {
  });
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
// ─────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────
function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "Give actionable steps.",
    "Be concise and high-impact.",
    "Focus on business, growth, and execution.",
    "You help users build businesses, make money, and grow fast.",
    "Be direct, practical, and actionable.",
    goal ? `User goal: ${goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────
// VALIDATION
// ─────────────────────────────
function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
@@ -63,9 +64,9 @@ function isValidMessages(messages) {
  );
}

// ─────────────────────────────────────────────
// Chat Route (MAIN AI ENGINE)
// ─────────────────────────────────────────────
// ─────────────────────────────
// CHAT ROUTE (MAIN AI)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body || {};
@@ -74,20 +75,20 @@ app.post("/api/chat", async (req, res) => {
    // ❌ Missing API key
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY in environment variables",
        error: "Missing GROQ_API_KEY",
      });
    }

    // ❌ Invalid messages
    // ❌ Invalid input
    if (!isValidMessages(messages)) {
      return res.status(400).json({
        error: "Invalid messages format",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // ─────────────────────────────
    // Call Groq API
    // ─────────────────────────────
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
@@ -103,11 +104,8 @@ app.post("/api/chat", async (req, res) => {
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
@@ -129,29 +127,17 @@ app.post("/api/chat", async (req, res) => {
      reply,
    });
  } catch (err) {
    console.error("Server error:", err);
    console.error("🔥 Server error:", err);

    return res.status(500).json({
      error:
        err.name === "AbortError"
          ? "Request timed out"
          : "Internal server error",
      error: "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────
// Static frontend (optional)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
