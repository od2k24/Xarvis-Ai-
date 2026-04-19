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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set in Railway Variables." });

    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

    const contents = [
      { role: "user",  parts: [{ text: `SYSTEM: ${SYSTEM}\n\nAcknowledge briefly.` }] },
      { role: "model", parts: [{ text: "Got it. I'm Xarvis AI — let's build your growth engine. What's your niche?" }] },
      ...history,
      { role: "user",  parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.9 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || `Error ${response.status}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    res.json({ reply, timestamp: new Date().toISOString() });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Xarvis AI live 🔥", keyLoaded: !!process.env.GEMINI_API_KEY, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚀 Xarvis on port ${PORT} | Key: ${!!process.env.GEMINI_API_KEY}`));
