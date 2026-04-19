require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. You are a viral strategist, YouTube growth expert, TikTok algorithm specialist, and monetization coach in one. Personality: Direct, energetic, data-driven, motivating. Cut through fluff, give REAL actionable strategies. Bold key terms with **bold**. Use emojis strategically. Always: give numbered steps, include hooks/scripts/examples, reference platform trends, end with a clear next step. Help creators get to six-figure income and viral growth.`;

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set in Railway Variables." });

    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required." });

    // Inject system prompt as first user/model exchange
    const systemTurn = [
      { role: "user",  parts: [{ text: `SYSTEM INSTRUCTIONS: ${SYSTEM}\n\nAcknowledge you understand.` }] },
      { role: "model", parts: [{ text: "Understood. I am Xarvis AI, ready to help creators go viral and build six-figure income. What's your niche and goal?" }] }
    ];

    const contents = [
      ...systemTurn,
      ...history,
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      const msg = data?.error?.message || `Gemini error ${response.status}`;
      return res.status(500).json({ error: msg });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    res.json({ reply, timestamp: new Date().toISOString() });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status:    "Xarvis AI live 🔥",
    keyLoaded: !!process.env.GEMINI_API_KEY,
    model:     "gemini-1.5-flash",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🔑 Key loaded: ${!!process.env.GEMINI_API_KEY}`);
});
