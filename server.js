console.log("🔥 NODE STARTED - FILE IS RUNNING");

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);

// ─────────────────────────────
// IMPORTS
// ─────────────────────────────
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

// ─────────────────────────────
// GROQ SETUP
// ─────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────
// APP SETUP
// ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// MIDDLEWARE
// ─────────────────────────────
app.use(cors());
app.use(express.json());

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
    status: "Xarvis AI API running 🚀",
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version,
  });
});

// Ping
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢",
  });
});

// ─────────────────────────────
// CHAT (FIXED + DEBUG SAFE)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages, history, context } = req.body || {};

    console.log("📨 BODY RECEIVED:", req.body);

    const chatHistory = messages || history || [];

    if (!message && chatHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No message provided",
      });
    }

    const formattedMessages = [
      {
        role: "system",
        content: `You are Xarvis AI. Be helpful, smart, and concise. Context: ${context || "none"}`,
      },
      ...chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // ─────────────────────────────
    // GROQ CALL (SAFE + DEBUGGED)
    // ─────────────────────────────
    let completion;

    try {
      completion = await groq.chat.completions.create({
        model: "llama3-70b-8192", // ✅ stable Groq model
        messages: formattedMessages,
        temperature: 0.7,
      });
    } catch (groqError) {
      console.error("🔥 GROQ ERROR FULL:", groqError);

      return res.status(500).json({
        success: false,
        error: "Groq request failed",
        details: groqError.message,
      });
    }

    const reply = completion?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty response from AI",
      });
    }

    return res.json({
      success: true,
      reply,
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ─────────────────────────────
// 404
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
