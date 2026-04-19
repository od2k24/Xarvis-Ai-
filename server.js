require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

/**
 * 🚨 PORT (Railway safe)
 */
const PORT = process.env.PORT || 3000;

/**
 * 🔥 MOVE GEMINI INSIDE SAFETY BLOCK (CRITICAL FIX)
 */
let genAI = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("✅ Gemini initialized");
} else {
  console.error("❌ GEMINI_API_KEY missing in Railway env vars");
}

/**
 * SYSTEM PROMPT
 */
const SYSTEM = `
You are Xarvis AI — an elite AI co-founder for content creators.
Be direct, structured, actionable.
`;

/**
 * HEALTH CHECK (always works)
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "alive 🔥",
    gemini: !!genAI,
    port: PORT
  });
});

/**
 * CHAT (SAFE GUARDED)
 */
app.post("/api/chat", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: "Gemini not initialized (missing API key)"
      });
    }

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
      success: true
    });

  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({
      error: "AI failed",
      details: err.message
    });
  }
});

/**
 * ROOT
 */
app.get("/", (req, res) => {
  res.send("🔥 Xarvis backend running");
});

/**
 * START
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Running on", PORT);
});
