import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─────────────────────────────────────────────
// BASIC CONFIG
// ─────────────────────────────────────────────
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// ─────────────────────────────────────────────
// DEBUG STARTUP
// ─────────────────────────────────────────────
console.log("🚀 Starting Xarvis AI Server...");
console.log("✅ API KEY EXISTS:", !!process.env.GROQ_API_KEY);

if (!process.env.GROQ_API_KEY) {
  console.error("❌ FATAL: Missing GROQ_API_KEY");
  process.exit(1);
}

// ─────────────────────────────────────────────
// GROQ CLIENT
// ─────────────────────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are Xarvis AI.

You are a powerful AI co-founder for creators, entrepreneurs, and builders.

Your personality:
- direct
- intelligent
- strategic
- high-energy
- concise but valuable

Always give actionable answers.
`;

// ─────────────────────────────────────────────
// TEST GROQ CONNECTION
// ─────────────────────────────────────────────
async function testGroq() {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: "Say: Groq connection successful"
        }
      ],
      max_tokens: 20,
    });

    console.log("✅ Groq API key is valid.");
    console.log("🧠 Test Response:",
      res?.choices?.[0]?.message?.content
    );

  } catch (err) {
    console.error("❌ FATAL: GROQ CONNECTION FAILED");
    console.error(err);

    process.exit(1);
  }
}

await testGroq();

// ─────────────────────────────────────────────
// ASK GROQ
// ─────────────────────────────────────────────
async function askGroq(messages, max_tokens = 1000) {

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...messages
    ],

    temperature: 0.7,
    max_tokens,
  });

  return (
    completion?.choices?.[0]?.message?.content ||
    "No response generated."
  );
}

// ─────────────────────────────────────────────
// HEALTH ROUTES
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🚀 Xarvis AI Backend Running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    groq: true,
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {

  try {

    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const messages = [
      ...history.slice(-10),
      {
        role: "user",
        content: message
      }
    ];

    const reply = await askGroq(messages, 900);

    res.json({
      success: true,
      reply
    });

  } catch (err) {

    console.error("❌ CHAT ERROR:");
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
      type: err?.type || null,
    });
  }
});

// ─────────────────────────────────────────────
// GENERATE CONTENT
// ─────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {

  try {

    const {
      type,
      topic,
      platform,
      content,
      goal
    } = req.body;

    let prompt = "";

    switch (type) {

      case "viral":
        prompt = `
Create a viral ${platform} content idea about:
${topic}

Include:
- hook
- title
- structure
- CTA
`;
        break;

      case "calendar":
        prompt = `
Create a 7-day content calendar for:
${topic}
`;
        break;

      case "feedback":
        prompt = `
Analyse this content and improve it:

${content}
`;
        break;

      case "agent":
        prompt = `
Create an execution plan for this goal:

${goal}
`;
        break;

      default:
        prompt = `
Help with this topic:
${topic}
`;
    }

    const reply = await askGroq([
      {
        role: "user",
        content: prompt
      }
    ], 1400);

    res.json({
      success: true,
      reply
    });

  } catch (err) {

    console.error("❌ GENERATE ERROR:");
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────
// STREAM CHAT
// ─────────────────────────────────────────────
app.post("/api/chat/stream", async (req, res) => {

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message required"
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reply = await askGroq([
      {
        role: "user",
        content: message
      }
    ], 900);

    for (const char of reply) {

      res.write(
        `data: ${JSON.stringify({
          type: "delta",
          content: char
        })}\n\n`
      );

      await new Promise(r => setTimeout(r, 5));
    }

    res.write(`data: [DONE]\n\n`);

    res.end();

  } catch (err) {

    console.error("❌ STREAM ERROR:");
    console.error(err);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: err.message
      })}\n\n`
    );

    res.end();
  }
});

// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
