// backend/server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!GROQ_API_KEY) {
  console.warn("⚠️ GROQ_API_KEY is not configured.");
}

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY,
    })
  : null;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function safeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.role === "string" &&
        typeof item.content === "string"
    )
    .slice(-20)
    .map((item) => ({
      role: item.role,
      content: item.content,
    }));
}

function requireGroq() {
  if (!groq) {
    const error = new Error("Groq AI is not configured.");
    error.status = 503;
    throw error;
  }

  return groq;
}

async function askGroq(messages) {
  const client = requireGroq();

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return response?.choices?.[0]?.message?.content || "";
}

function buildSystemPrompt() {
  return `
You are Xarvis AI.

You are an intelligent AI co-founder and strategic assistant.

Your job is to help the user:
- build projects
- create content
- develop ideas
- solve problems
- plan actions
- improve productivity
- grow businesses
- make decisions
- turn ideas into practical next steps

Be useful, direct and practical.

Do not pretend that something has been completed when it has not.

If you do not know something, say so.

Give the user clear actionable steps.
`.trim();
}

// --------------------------------------------------
// ROOT
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "xarvis-backend",
    message: "Xarvis AI backend is running.",
  });
});

// --------------------------------------------------
// HEALTH
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "xarvis-backend",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "xarvis-backend",
    groqConfigured: Boolean(GROQ_API_KEY),
    model: GROQ_MODEL,
  });
});

// --------------------------------------------------
// CHAT
// --------------------------------------------------

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history,
      messages,
      systemPrompt,
    } = req.body || {};

    let chatMessages = [];

    // Frontend format:
    // { message, history }

    if (typeof message === "string" && message.trim()) {
      const safe = safeHistory(history);

      chatMessages = [
        {
          role: "system",
          content: systemPrompt || buildSystemPrompt(),
        },
        ...safe,
        {
          role: "user",
          content: message.trim(),
        },
      ];
    }

    // Alternative format:
    // { messages, systemPrompt }

    else if (Array.isArray(messages)) {
      const safe = safeHistory(messages);

      chatMessages = [
        {
          role: "system",
          content: systemPrompt || buildSystemPrompt(),
        },
        ...safe,
      ];
    }

    else {
      return res.status(400).json({
        error: "message or messages is required",
      });
    }

    const reply = await askGroq(chatMessages);

    res.json({
      reply,
      content: reply,
      message: reply,
    });
  } catch (error) {
    console.error("Groq chat error:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });

    const status = error.status || 500;

    res.status(status).json({
      error:
        status === 401
          ? "Groq authentication failed. Check the GROQ_API_KEY."
          : "Xarvis AI could not process the request.",
    });
  }
});

// --------------------------------------------------
// STREAM CHAT
// --------------------------------------------------

app.post("/api/chat/stream", async (req, res) => {
  try {
    const {
      message,
      history,
      messages,
      systemPrompt,
    } = req.body || {};

    let chatMessages = [];

    if (typeof message === "string" && message.trim()) {
      chatMessages = [
        {
          role: "system",
          content: systemPrompt || buildSystemPrompt(),
        },
        ...safeHistory(history),
        {
          role: "user",
          content: message.trim(),
        },
      ];
    }

    else if (Array.isArray(messages)) {
      chatMessages = [
        {
          role: "system",
          content: systemPrompt || buildSystemPrompt(),
        },
        ...safeHistory(messages),
      ];
    }

    else {
      return res.status(400).json({
        error: "message or messages is required",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reply = await askGroq(chatMessages);

    // Send the response in chunks so the existing
    // frontend streaming code can consume it.

    const chunkSize = 12;

    for (let i = 0; i < reply.length; i += chunkSize) {
      const chunk = reply.slice(i, i + chunkSize);

      res.write(
        `data: ${JSON.stringify({
          type: "delta",
          content: chunk,
          delta: chunk,
        })}\n\n`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 5)
      );
    }

    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`
    );

    res.write("data: [DONE]\n\n");

    res.end();
  } catch (error) {
    console.error("Groq stream error:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });

    if (!res.headersSent) {
      return res.status(error.status || 500).json({
        error: "Xarvis AI streaming failed.",
      });
    }

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: "Xarvis AI streaming failed.",
      })}\n\n`
    );

    res.end();
  }
});

// --------------------------------------------------
// GENERATE
// --------------------------------------------------

app.post("/api/generate", async (req, res) => {
  try {
    const {
      type,
      topic,
      platform,
      memory,
      content,
      goal,
    } = req.body || {};

    let prompt;

    switch (type) {
      // --------------------------------------------
      // VIRAL CONTENT
      // --------------------------------------------

      case "viral":
        prompt = `
Create a high-quality viral content idea.

Topic:
${topic || "Not provided"}

Platform:
${platform || "General"}

User memory/context:
${JSON.stringify(memory || {}, null, 2)}

Return:
1. Hook
2. Main idea
3. Structure
4. Call to action
5. Why it could perform well

Make it practical and ready to use.
`;
        break;

      // --------------------------------------------
      // POST NEXT
      // --------------------------------------------

      case "postnext":
        prompt = `
Based on the creator's context and memory below,
decide what they should post next.

Memory/context:
${JSON.stringify(memory || {}, null, 2)}

Return:

1. The exact post idea
2. Hook
3. Platform
4. Suggested format
5. Caption/script outline
6. Call to action
7. Why this should be posted next

Make the recommendation specific and actionable.
`;
        break;

      // --------------------------------------------
      // CONTENT CALENDAR
      // --------------------------------------------

      case "calendar":
        prompt = `
Create a practical content calendar based on the
creator's memory and goals.

Memory/context:
${JSON.stringify(memory || {}, null, 2)}

Create a useful posting plan with:
- day
- platform
- content idea
- hook
- format
- CTA

Keep it realistic and actionable.
`;
        break;

      // --------------------------------------------
      // FEEDBACK
      // --------------------------------------------

      case "feedback":
        prompt = `
Analyze the following content and provide useful
creator feedback.

Content:
${content || "No content provided"}

Creator memory/context:
${JSON.stringify(memory || {}, null, 2)}

Return:

1. What is good
2. What is weak
3. What should change
4. A stronger hook
5. A stronger structure
6. A practical next step
`;
        break;

      // --------------------------------------------
      // AGENT
      // --------------------------------------------

      case "agent":
        prompt = `
Act as Xarvis AI Agent.

User goal:
${goal || "No goal provided"}

User memory/context:
${JSON.stringify(memory || {}, null, 2)}

Break the goal into practical steps.

Give:
1. Immediate next action
2. Short-term actions
3. Important decisions
4. Potential problems
5. Best strategy
6. Clear next step
`;
        break;

      // --------------------------------------------
      // UNKNOWN
      // --------------------------------------------

      default:
        return res.status(400).json({
          error: `Unknown generation type: ${type || "missing"}`,
        });
    }

    const reply = await askGroq([
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: prompt.trim(),
      },
    ]);

    res.json({
      success: true,
      type,
      result: reply,
      content: reply,
      reply,
    });
  } catch (error) {
    console.error("Generate error:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });

    res.status(error.status || 500).json({
      success: false,
      error: "Xarvis AI could not generate the requested content.",
    });
  }
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", {
    name: err.name,
    message: err.message,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal server error.",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`Xarvis AI backend running on port ${PORT}`);
});
