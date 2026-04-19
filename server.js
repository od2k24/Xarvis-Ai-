require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

/**
 * ✅ Middleware
 */
app.use(cors({ origin: "*" }));
app.use(express.json());

/**
 * 🚨 CRITICAL FIX: Railway PORT handling
 * NEVER hardcode 3001 on Railway
 */
const PORT = process.env.PORT || 3000;

/**
 * 🚨 Safety check
 */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing!");
}

/**
 * Gemini setup
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * System prompt
 */
const SYSTEM = `
You are Xarvis AI — an elite AI co-founder for content creators.

Be:
- Direct
- Energetic
- Structured
- Actionable

Always give:
1. Numbered steps
2. Examples
3. Clear next action
`;

/**
 * HEALTH CHECK
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis AI alive 🔥",
    time: new Date().toISOString(),
    port: PORT
  });
});

/**
 * CHAT ENDPOINT
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM,
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({
      reply,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Chat error:", err);

    res.status(500).json({
      error: "AI request failed",
      details: err.message
    });
  }
});

/**
 * ROOT TEST (VERY IMPORTANT FOR DEBUGGING)
 */
app.get("/", (req, res) => {
  res.send("🔥 Xarvis backend is running");
});

/**
 * START SERVER
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
