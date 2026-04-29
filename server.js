const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ HEALTH CHECK FIRST
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// CONFIG
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(goal) {
  return `You are Xarvis — an elite AI co-founder.
- Give actionable steps
- Be concise
- Focus on making money and growth
${goal ? `User goal: ${goal}` : ""}`;
}

// ✅ CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const { messages, goal } = req.body;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(goal) },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ error: data });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || "No response",
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

// ✅ STATIC AFTER API
app.use(express.static(path.join(__dirname, "public")));

// ✅ FALLBACK LAST
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
