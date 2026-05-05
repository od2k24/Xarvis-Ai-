import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────
app.use(cors({
  origin: "*", // allow frontend anywhere (fixes most network errors)
}));

app.use(express.json());

// ─── GROQ CLIENT ──────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── HEALTH CHECK ─────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Xarvis AI running 🚀" });
});

// ─── CHAT ROUTE ───────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are Xarvis AI." },
        ...messages,
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content;

    res.json({ reply });

  } catch (err) {
    console.error("❌ CHAT ERROR:", err);

    res.status(500).json({
      error: "AI temporarily unavailable",
    });
  }
});

// ─── START SERVER ─────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
