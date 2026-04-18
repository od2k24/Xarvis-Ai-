require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔥 UPGRADED SYSTEM PROMPT (structured output)
const XARVIS_SYSTEM_PROMPT = `
You are Xarvis AI — an elite viral growth co-founder for content creators.

You must respond in VALID JSON ONLY.

Output format:
{
  "viralScore": number (0-100),
  "reason": "short reason",
  "tactics": ["tactic1", "tactic2", "tactic3"],
  "reply": "main advice in sharp tone",
  "contrarianInsight": "one deep insight most creators miss"
}

Rules:
- Be brutally honest
- Think like a viral strategist, not a chatbot
- No fluff
- No extra text outside JSON
`;

// optional fallback safety parser
function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {
      viralScore: 50,
      reason: "fallback parse failed",
      tactics: [],
      reply: text,
      contrarianInsight: ""
    };
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: XARVIS_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    const parsed = safeJSONParse(text);

    res.json({
      ...parsed,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({
      error: err.message || "Something went wrong.",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis AI v2 live 🔥",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI backend running on http://localhost:${PORT}`);
});
