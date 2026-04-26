require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

const SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. Be direct, actionable, and strategic. Use bold key terms, numbered steps, and practical examples.`;

// Safe fetch (Node 18+ supports global fetch, but this prevents edge crashes)
const safeFetch = global.fetch || ((...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args))
);

// CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid or missing message" });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    const messages = [
      { role: "system", content: SYSTEM },
      ...safeHistory.map((h) => ({
        role: h?.role === "model" ? "assistant" : h?.role || "user",
        content: h?.parts?.[0]?.text || h?.content || ""
      })),
      { role: "user", content: message }
    ];

    // Timeout wrapper (prevents hanging requests)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await safeFetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 1024
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(500).json({
        error: data?.error?.message || "Groq API error"
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    return res.json({
      reply: reply || "No response from AI"
    });

  } catch (err) {
    console.error("Server Error:", err);

    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Request timeout" });
    }

    return res.status(500).json({ error: "Server crashed" });
  }
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    uptime: process.uptime()
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
