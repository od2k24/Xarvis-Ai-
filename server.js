import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── HEALTH CHECK ───────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Xarvis AI running 🚀" });
});

// ─── CHAT ENDPOINT ──────────────────────
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are Xarvis AI." },
        ...messages,
      ],
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content || "No response",
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);

    res.status(500).json({
      error: "AI temporarily unavailable",
    });
  }
});

// ─── START SERVER ───────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
