const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ Universal fetch (Node <18 safe)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "- Give actionable steps",
    "- Be concise",
    "- Focus on making money and growth",
    goal ? `User goal: ${goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every((m) => m.role && m.content)
  );
}

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// ─────────────────────────────────────────────
// Chat Route
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal } = req.body ?? {};
    const apiKey = process.env.GROQ_API_KEY;

    // ✅ Validate API key
    if (!apiKey) {
      return res.status(500).json({
        error: "Server misconfiguration: missing GROQ_API_KEY",
      });
    }

    // ✅ Validate input
    if (!isValidMessages(messages)) {
      return res.status(400).json({
        error: "messages must be a non-empty array of { role, content }",
      });
    }

    console.log(`📩 Chat request (${messages.length} messages)`);

    // ✅ Timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response;

    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: buildSystemPrompt(goal) },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === "AbortError") {
        return res.status(504).json({ error: "Request timed out" });
      }

      return res.status(502).json({
        error: `Network error: ${err.message}`,
      });
    }

    clearTimeout(timeout);

    // ✅ Parse response safely
    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(502).json({
        error: "Invalid response from Groq API",
      });
    }

    // ✅ Handle API error
    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || "Groq API error",
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "Empty response from model",
      });
    }

    console.log(`✅ Reply generated (${reply.length} chars)`);

    return res.json({
      success: true,
      reply,
      usage: data.usage,
    });

  } catch (err) {
    console.error("🔥 Server error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────
// Static Files
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
});
