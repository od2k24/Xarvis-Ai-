const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ FIX: ensure fetch works on all Node versions
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ HEALTH CHECK
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

// ✅ CHAT ROUTE (FULLY FIXED)
app.post("/api/chat", async (req, res) => {
  try {
    console.log("📩 Incoming body:", req.body);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing GROQ_API_KEY");
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    // ✅ FIX: safe destructuring
    const { messages = [], goal } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    // ✅ OPTIONAL: timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    console.log("🤖 Groq response:", data);

    if (!response.ok) {
      console.error("❌ Groq error:", data);
      return res.status(500).json({
        error: data?.error?.message || "Groq API failed",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content || "No response from model";

    res.json({ reply });

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);

    // ✅ Better error messages
    if (err.name === "AbortError") {
      return res.status(500).json({ error: "Request timeout" });
    }

    res.status(500).json({
      error: err.message || "Server crashed",
    });
  }
});

// ✅ STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// ✅ FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
