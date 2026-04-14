import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================
// SAFETY MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// HEALTH CHECK (RAILWAY NEEDS THIS)
// ==========================
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis is running 🚀",
    time: new Date().toISOString()
  });
});

// ==========================
// SIMPLE AUTH
// ==========================
const API_KEY = process.env.XARVIS_API_KEY;

function auth(req, res, next) {
  if (!API_KEY) return res.status(500).json({ error: "Missing API KEY" });

  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ==========================
// SIMPLE MEMORY (SAFE)
// ==========================
const memory = new Map();

// ==========================
// VIRAL SCORE
// ==========================
function viralScore(text = "") {
  let score = 50;

  const t = text.toLowerCase();

  if (t.includes("secret")) score += 10;
  if (t.includes("you")) score += 5;
  if (text.length < 300) score += 10;
  if (text.includes("?")) score += 5;

  return Math.min(100, score);
}

// ==========================
// SAFE RESPONSE ENGINE (NO CRASH AI)
// ==========================
function generateResponse(message, userMemory) {
  return `
🔥 GOAL
${message}

⚡ STRATEGY
Focus on high-impact content in your niche: ${userMemory.niche || "unknown"}

🧠 EXECUTION
1. Pick one strong idea
2. Turn it into short-form content
3. Post consistently
4. Improve based on feedback

🎯 OUTPUT
Create 3 viral versions of: "${message}"

🚀 EDGE
Consistency + hooks = growth
`;
}

// ==========================
// CHAT ENDPOINT
// ==========================
app.post("/api/chat", auth, (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const ip = req.ip;

    if (!memory.has(ip)) {
      memory.set(ip, { niche: null, messages: [] });
    }

    const userMemory = memory.get(ip);

    userMemory.messages.push(message);
    userMemory.messages = userMemory.messages.slice(-20);

    if (message.toLowerCase().includes("youtube")) {
      userMemory.niche = "youtube";
    }

    const reply = generateResponse(message, userMemory);

    res.json({
      reply,
      viralScore: viralScore(reply),
      memory: userMemory
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server crashed" });
  }
});

// ==========================
// START SERVER (RAILWAY SAFE)
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
