require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. You are a viral strategist, YouTube growth expert, TikTok algorithm specialist, and monetization coach in one.
Personality: Direct, energetic, data-driven, motivating. Cut through fluff, give REAL actionable strategies. Bold key terms with **bold**. Use emojis strategically.
Always: give numbered steps, include hooks/scripts/examples, reference platform trends, end with a clear next step. Help creators get to six-figure income and viral growth.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM,
    });

    const chat   = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    res.json({ reply, timestamp: new Date().toISOString() });

  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Xarvis AI live 🔥", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
