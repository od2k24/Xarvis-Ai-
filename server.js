
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

if (!process.env.GROQ_API_KEY) {
  console.error("ERROR: GROQ_API_KEY is missing.");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "openai/gpt-oss-120b";

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Xarvis AI Backend",
    provider: "Groq",
    model: MODEL,
  });
});

function buildMessages(message, history = [], systemPrompt) {
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
        )
        .slice(-20)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }))
    : [];

  return [
    {
      role: "system",
      content:
        typeof systemPrompt === "string" && systemPrompt.trim()
          ? systemPrompt
          : "You are Xarvis, a helpful and intelligent AI assistant.",
    },
    ...safeHistory,
    {
      role: "user",
      content: message.trim(),
    },
  ];
}

// Normal chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], systemPrompt } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "A valid message is required.",
      });
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: buildMessages(message, history, systemPrompt),
      max_completion_tokens: 1024,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      error: "Xarvis couldn't process your message.",
    });
  }
});

// Streaming chat endpoint
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { message, history = [], systemPrompt } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "A valid message is required.",
      });
    }

    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: buildMessages(message, history, systemPrompt),
      max_completion_tokens: 1024,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const chunk of stream) {
      if (res.destroyed) break;

      const token = chunk.choices[0]?.delta?.content;

      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    if (!res.destroyed) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (error) {
    console.error("Streaming error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Xarvis couldn't start the response stream.",
      });
    }

    if (!res.destroyed) {
      res.write(
        `data: ${JSON.stringify({ error: "Streaming failed." })}\n\n`
      );
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Xarvis backend running on port ${PORT}`);
  console.log("AI provider: Groq");
  console.log(`AI model: ${MODEL}`);
});
