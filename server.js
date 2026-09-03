```js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─────────────────────────────────────────────
// BASIC CONFIG
// ─────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ─────────────────────────────────────────────
// GROQ CONFIG
// ─────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

console.log("🚀 Starting Xarvis AI Server...");
console.log("🔑 Groq API key configured:", !!GROQ_API_KEY);
console.log("🧠 Groq model:", GROQ_MODEL);

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY,
    })
  : null;

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
// GROQ HELPER
// ─────────────────────────────────────────────
async function askGroq(messages, maxTokens = 1000) {
  if (!groq) {
    const error = new Error("Groq API is not configured.");
    error.status = 503;
    throw error;
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const reply = completion?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("Groq returned an empty response.");
  }

  return reply;
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Xarvis AI Backend Running",
  });
});

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "xarvis-ai-backend",
    groqConfigured: !!GROQ_API_KEY,
    model: GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "xarvis-ai-backend",
    groqConfigured: !!GROQ_API_KEY,
    model: GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// CHAT
// Supports both:
//
// { message: "...", history: [...] }
//
// and the frontend format:
//
// { messages: [...], systemPrompt: "..." }
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, messages, systemPrompt } = req.body;

    let chatMessages = [];

    // Frontend format: { messages: [...] }
    if (Array.isArray(messages)) {
      chatMessages = messages
        .filter(
          (item) =>
            item &&
            (item.role === "user" ||
              item.role === "assistant" ||
              item.role === "system") &&
            typeof item.content === "string"
        )
        .slice(-20);
    }

    // Alternative format: { message, history }
    else {
      const validHistory = Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (item.role === "user" ||
                  item.role === "assistant" ||
                  item.role === "system") &&
                typeof item.content === "string"
            )
            .slice(-20)
        : [];

      if (validHistory.length > 0) {
        chatMessages = [...validHistory];
      }

      if (typeof message === "string" && message.trim()) {
        chatMessages.push({
          role: "user",
          content: message.trim(),
        });
      }
    }

    if (chatMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "A message or messages array is required.",
      });
    }

    // Only use a frontend system prompt if supplied.
    // Otherwise askGroq uses Xarvis's default system prompt.
    if (typeof systemPrompt === "string" && systemPrompt.trim()) {
      chatMessages = [
        {
          role: "system",
          content: systemPrompt.trim(),
        },
        ...chatMessages.filter((item) => item.role !== "system"),
      ];
    }

    const reply = await askGroq(chatMessages, 900);

    res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ CHAT ERROR:", err);

    const status = err?.status || 500;

    res.status(status).json({
      success: false,
      error:
        status === 503
          ? "Groq AI is not configured on the backend."
          : "Xarvis AI could not generate a response.",
    });
  }
});

// ─────────────────────────────────────────────
// CONTENT GENERATION
// ─────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const {
      type,
      topic,
      platform,
      content,
      goal,
    } = req.body;

    let prompt = "";

    switch (type) {
      case "viral":
        prompt = `
Create a viral ${platform || "social media"} content idea about:

${topic || ""}

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

${topic || ""}
`;
        break;

      case "feedback":
        prompt = `
Analyse this content and improve it:

${content || ""}
`;
        break;

      case "agent":
        prompt = `
Create an execution plan for this goal:

${goal || ""}
`;
        break;

      default:
        prompt = `
Help with this topic:

${topic || ""}
`;
    }

    const reply = await askGroq(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      1400
    );

    res.json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ GENERATE ERROR:", err);

    const status = err?.status || 500;

    res.status(status).json({
      success: false,
      error:
        status === 503
          ? "Groq AI is not configured on the backend."
          : "Content generation failed.",
    });
  }
});

// ─────────────────────────────────────────────
// STREAM CHAT
// ─────────────────────────────────────────────
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { message, messages } = req.body;

    let chatMessages = [];

    if (Array.isArray(messages)) {
      chatMessages = messages
        .filter(
          (item) =>
            item &&
            (item.role === "user" ||
              item.role === "assistant" ||
              item.role === "system") &&
            typeof item.content === "string"
        )
        .slice(-20);
    } else if (typeof message === "string" && message.trim()) {
      chatMessages = [
        {
          role: "user",
          content: message.trim(),
        },
      ];
    }

    if (chatMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "A message or messages array is required.",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reply = await askGroq(chatMessages, 900);

    for (const char of reply) {
      res.write(
        `data: ${JSON.stringify({
          type: "delta",
          content: char,
        })}\n\n`
      );

      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("❌ STREAM ERROR:", err);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "Xarvis AI could not generate a response.",
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
    success: false,
    error: "Route not found",
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on port ${PORT}`);
});
```
