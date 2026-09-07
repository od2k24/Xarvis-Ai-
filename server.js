require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY is not configured.");
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

  const allowedRoles = new Set([
    "user",
    "assistant",
    "system",
  ]);

  return history
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        allowedRoles.has(item.role) &&
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
    const error = new Error(
      "Groq AI is not configured."
    );

    error.status = 503;

    throw error;
  }

  return groq;
}

async function askGroq(messages) {
  const client = requireGroq();

  const response =
    await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

  const reply =
    response?.choices?.[0]?.message?.content;

  if (typeof reply !== "string") {
    const error = new Error(
      "Groq returned an empty response."
    );

    error.status = 502;

    throw error;
  }

  return reply;
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

function getErrorStatus(error) {
  const status = Number(error?.status);

  if (
    Number.isInteger(status) &&
    status >= 400 &&
    status < 600
  ) {
    return status;
  }

  return 500;
}

function getPublicError(status) {
  if (status === 401) {
    return "Groq authentication failed. Check the GROQ_API_KEY.";
  }

  if (status === 429) {
    return "Groq rate limit reached. Please try again shortly.";
  }

  if (status === 503) {
    return "Groq AI is not configured on the server.";
  }

  if (status === 502) {
    return "Groq returned an invalid response.";
  }

  return "Xarvis AI could not process the request.";
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

    let chatMessages;

    // Frontend format:
    // { message, history }

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      chatMessages = [
        {
          role: "system",
          content:
            systemPrompt || buildSystemPrompt(),
        },

        ...safeHistory(history),

        {
          role: "user",
          content: message.trim(),
        },
      ];
    }

    // Alternative format:
    // { messages, systemPrompt }

    else if (Array.isArray(messages)) {
      chatMessages = [
        {
          role: "system",
          content:
            systemPrompt || buildSystemPrompt(),
        },

        ...safeHistory(messages),
      ];
    }

    else {
      return res.status(400).json({
        error:
          "message or messages is required",
      });
    }

    const reply = await askGroq(chatMessages);

    return res.json({
      reply,
      content: reply,
      message: reply,
    });
  }

  catch (error) {
    console.error("Groq chat error:", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });

    const status = getErrorStatus(error);

    return res.status(status).json({
      error: getPublicError(status),
    });
  }
});

// --------------------------------------------------
// STREAM CHAT
// --------------------------------------------------

app.post(
  "/api/chat/stream",
  async (req, res) => {
    try {
      const {
        message,
        history,
        messages,
        systemPrompt,
      } = req.body || {};

      let chatMessages;

      if (
        typeof message === "string" &&
        message.trim()
      ) {
        chatMessages = [
          {
            role: "system",
            content:
              systemPrompt ||
              buildSystemPrompt(),
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
            content:
              systemPrompt ||
              buildSystemPrompt(),
          },

          ...safeHistory(messages),
        ];
      }

      else {
        return res.status(400).json({
          error:
            "message or messages is required",
        });
      }

      res.setHeader(
        "Content-Type",
        "text/event-stream"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      res.flushHeaders();

      const reply =
        await askGroq(chatMessages);

      const chunkSize = 12;

      for (
        let i = 0;
        i < reply.length;
        i += chunkSize
      ) {
        const chunk = reply.slice(
          i,
          i + chunkSize
        );

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

      res.write(
        "data: [DONE]\n\n"
      );

      return res.end();
    }

    catch (error) {
      console.error(
        "Groq stream error:",
        {
          name: error?.name,
          message: error?.message,
          status: error?.status,
        }
      );

      if (!res.headersSent) {
        const status =
          getErrorStatus(error);

        return res.status(status).json({
          error:
            "Xarvis AI streaming failed.",
        });
      }

      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error:
            "Xarvis AI streaming failed.",
        })}\n\n`
      );

      return res.end();
    }
  }
);

// --------------------------------------------------
// GENERATE
// --------------------------------------------------

app.post(
  "/api/generate",
  async (req, res) => {
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

        // ------------------------------
        // VIRAL
        // ------------------------------

        case "viral":

          prompt = `
Create a high-quality viral content idea.

Topic:
${topic || "Not provided"}

Platform:
${platform || "General"}

User memory/context:
${JSON.stringify(
  memory || {},
  null,
  2
)}

Return:

1. Hook
2. Main idea
3. Structure
4. Call to action
5. Why it could perform well

Make it practical and ready to use.
`;

          break;

        // ------------------------------
        // POST NEXT
        // ------------------------------

        case "postnext":

          prompt = `
Based on the creator's context and memory below,
decide what they should post next.

Memory/context:
${JSON.stringify(
  memory || {},
  null,
  2
)}

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

        // ------------------------------
        // CALENDAR
        // ------------------------------

        case "calendar":

          prompt = `
Create a practical content calendar based on the
creator's memory and goals.

Memory/context:
${JSON.stringify(
  memory || {},
  null,
  2
)}

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

        // ------------------------------
        // FEEDBACK
        // ------------------------------

        case "feedback":

          prompt = `
Analyze the following content and provide useful
creator feedback.

Content:
${content || "No content provided"}

Creator memory/context:
${JSON.stringify(
  memory || {},
  null,
  2
)}

Return:

1. What is good
2. What is weak
3. What should change
4. A stronger hook
5. A stronger structure
6. A practical next step
`;

          break;

        // ------------------------------
        // AGENT
        // ------------------------------

        case "agent":

          prompt = `
Act as Xarvis AI Agent.

User goal:
${goal || "No goal provided"}

User memory/context:
${JSON.stringify(
  memory || {},
  null,
  2
)}

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

        // ------------------------------
        // UNKNOWN
        // ------------------------------

        default:

          return res.status(400).json({
            error:
              `Unknown generation type: ${
                type || "missing"
              }`,
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

      return res.json({
        success: true,
        type,
        result: reply,
        content: reply,
        reply,
      });
    }

    catch (error) {
      console.error(
        "Generate error:",
        {
          name: error?.name,
          message: error?.message,
          status: error?.status,
        }
      );

      const status =
        getErrorStatus(error);

      return res.status(status).json({
        success: false,
        error:
          "Xarvis AI could not generate the requested content.",
      });
    }
  }
);

// --------------------------------------------------
// SCORE
// --------------------------------------------------

async function scoreContent(req, res) {
  try {
    const body = req.body || {};

    const text =
      typeof body.content === "string"
        ? body.content
        : typeof body.text === "string"
          ? body.text
          : typeof body.idea === "string"
            ? body.idea
            : typeof body.message === "string"
              ? body.message
              : "";

    if (!text.trim()) {
      return res.status(400).json({
        error:
          "content, text, idea, or message is required",
      });
    }

    const reply = await askGroq([
      {
        role: "system",
        content: `
You are Xarvis AI content scoring assistant.

Evaluate the submitted content fairly and practically.

Return:

- overall score out of 100
- hook score out of 100
- clarity score out of 100
- value score out of 100
- engagement score out of 100
- strengths
- weaknesses
- specific improvements

Do not claim that the content was tested,
published, or validated with real audience data.
`.trim(),
      },

      {
        role: "user",
        content: text.trim(),
      },
    ]);

    return res.json({
      success: true,
      score: reply,
      result: reply,
      content: reply,
      reply,
    });
  }

  catch (error) {
    console.error(
      "Score error:",
      {
        name: error?.name,
        message: error?.message,
        status: error?.status,
      }
    );

    const status =
      getErrorStatus(error);

    return res.status(status).json({
      success: false,
      error: getPublicError(status),
    });
  }
}

app.post(
  "/score",
  scoreContent
);

app.post(
  "/api/score",
  scoreContent
);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use(
  (err, req, res, next) => {
    console.error(
      "Unhandled server error:",
      {
        name: err?.name,
        message: err?.message,
      }
    );

    if (res.headersSent) {
      return next(err);
    }

    return res.status(500).json({
      error:
        "Internal server error.",
    });
  }
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `Xarvis AI backend running on port ${PORT}`
  );
});
