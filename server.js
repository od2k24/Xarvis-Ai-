require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

const SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. Be direct, actionable, and strategic. Use bold key terms, numbered steps, and practical examples.`;

// CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const messages = [
      { role: "system", content: SYSTEM },
      ...history.map(h => ({
        role: h.role === "model" ? "assistant" : h.role,
        content: h.parts?.[0]?.text || ""
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Groq API error"
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "No response";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crashed" });
  }
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis running",
    key: !!process.env.GROQ_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
