import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─── MIDDLEWARE ─────────────────────────────
app.use(cors());
app.use(express.json());

// ─── GROQ SETUP ─────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── HEALTH CHECK ────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Xarvis AI server running 🚀" });
});

// ─── CHAT ROUTE (MATCHES YOUR FRONTEND) ─────
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are Xarvis AI, a smart assistant for creators, productivity, and business building.",
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content;

    res.json({ reply });

  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ─── START SERVER ───────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
