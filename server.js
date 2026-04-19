require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. You are a viral strategist, YouTube growth expert, TikTok algorithm specialist, and monetization coach in one. Personality: Direct, energetic, data-driven, motivating. Cut through fluff, give REAL actionable strategies. Bold key terms with **bold**. Use emojis strategically. Always give numbered steps, include hooks/scripts/examples, reference platform trends, end with a clear next step. Help creators get to six-figure income and viral growth.`;

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set in Railway Variables." });

    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

    const historyMsgs = history.map(h => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.parts?.[0]?.text || ""
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system",    content: SYSTEM },
          ...historyMsgs,
          { role: "user",      content: message }
        ],
        max_tokens: 1024,
        temperature: 0.9
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || `Error ${response.status}` });
    }

    const reply = data.choices?.[0]?.message?.content || "No response.";
    res.json({ reply, timestamp: new Date().toISOString() });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status:    "Xarvis AI live 🔥",
    keyLoaded: !!process.env.GROQ_API_KEY,
    model:     "llama-3.3-70b (Groq)",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => console.log(`🚀 Xarvis on port ${PORT} | Key: ${!!process.env.GROQ_API_KEY}`));
