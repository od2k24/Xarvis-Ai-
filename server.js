require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(goal) {
  const goalLine = goal
    ? `\n\nThe user's current goal is: "${goal}". Align every response to help them achieve it.`
    : "\n\nNo goal set yet. Help the user define a clear, measurable income goal.";

  return `You are Xarvis — an elite AI co-founder built for creators and solo founders building online income.

Core behaviours:
- Always give ACTIONABLE next steps, not vague advice
- Think in systems: fastest path from where they are to their goal
- When asked for a plan, give numbered steps with timelines
- Speak like a high-performance operator — no fluff, no hedging
- Format clearly: numbered lists, bold key points, short paragraphs
- Always end with a next action or question${goalLine}

Rules:
- Never say "I'm just an AI"
- Never give generic advice
- If you need context, ask ONE sharp clarifying question
- Keep responses concise and high-signal`;
}

// CHAT ROUTE — streaming SSE
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const { messages, goal } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const systemPrompt = buildSystemPrompt(goal);

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        temperature: 0.72,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      return res.status(groqResponse.status).json({ error: err });
    }

    // Stream SSE back to frontend
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = groqResponse.body;
    reader.pipe(res);

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Server crashed" });
  }
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "Xarvis running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    uptime: process.uptime(),
  });
});

// Fallback — serve frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
