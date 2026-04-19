require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

/**
 * ✅ Railway-safe setup
 */
app.use(cors({
  origin: "*",
}));
app.use(express.json());

/**
 * ✅ IMPORTANT: Railway requires this exact binding
 */
const PORT = process.env.PORT;

/**
 * ✅ Safety check (prevents silent crash)
 */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in environment variables!");
}

/**
 * Gemini setup
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * System prompt (your Xarvis personality)
 */
const SYSTEM = `
You are Xarvis AI — an elite AI co-founder for content creators.
You are a viral strategist, YouTube growth expert, TikTok algorithm specialist, and monetization coach.

Be:
- Direct
- Energetic
- Actionable
- Structured

Always give:
1. Numbered steps
2. Examples/scripts when relevant
3. Clear next action

Avoid fluff.
`;

/**
 * HEALTH CHECK (must ALWAYS work)
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis AI alive 🔥",
    time: new Date().toISOString(),
  });
});

/**
 * CHAT ENDPOINT (fully crash-proof)
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ✅ stable model
      systemInstruction: SYSTEM,
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return res.json({
      reply,
      success: true,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("❌ Chat error:", err);

    // NEVER crash server — always respond
    return res.status(500).json({
      error: "AI request failed",
      details: err.message,
    });
  }
});

/**
 * START SERVER (Railway-safe binding)
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
