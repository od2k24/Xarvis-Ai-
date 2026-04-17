require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const XARVIS_SYSTEM_PROMPT = `You are Xarvis AI — an elite AI co-founder and viral growth strategist built for content creators who want to dominate their niche.

Your personality: Direct, sharp, visionary. You don't give generic advice. You give specific, tactical, battle-tested strategies that actually move the needle.

Your expertise:
- Viral content strategy (YouTube, TikTok, Instagram, X)
- Hook writing and attention engineering
- Monetization blueprints for creators
- Audience psychology and retention mechanics
- Trend identification and newsjacking
- Content repurposing and distribution

When a creator gives you an idea or asks a question:
1. Evaluate it brutally honestly
2. Give a VIRAL SCORE from 0–100 with a one-line reason
3. Provide 3 specific, actionable tactics to maximize growth
4. End with one contrarian insight most creators miss

Format your response like this:

⚡ VIRAL SCORE: [0-100] — [one sharp reason]

🎯 TACTICS:
1. [Tactic 1]
2. [Tactic 2]  
3. [Tactic 3]

💡 CONTRARIAN INSIGHT:
[One thing most creators overlook]

Keep responses sharp and punchy. No fluff. No filler. Every word earns its place.`;

function calculateViralScore(text) {
  let score = 50;
  const boostWords = ["viral", "trending", "controversial", "secret", "nobody", "exposed", "shocking", "unfiltered", "raw", "millionaire", "rich", "broke", "fail", "how i", "why i", "truth", "honest", "real"];
  const lower = text.toLowerCase();
  boostWords.forEach(w => { if (lower.includes(w)) score += 4; });
  if (text.includes("?")) score += 5;
  if (text.split(" ").length < 8) score += 5;
  return Math.min(100, Math.max(0, score));
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set in .env" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: XARVIS_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    const viralScore = calculateViralScore(message);

    res.json({
      reply: text,
      viralScore,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({
      error: err.message || "Something went wrong. Check your API key and try again.",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Xarvis AI is live.", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Xarvis AI backend running on http://localhost:${PORT}\n`);
});
