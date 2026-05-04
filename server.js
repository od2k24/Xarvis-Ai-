console.log("🔥 NODE STARTED - FILE IS RUNNING");

// ─────────────────────────────
// DEPENDENCIES
// ─────────────────────────────
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const rateLimit = require("express-rate-limit");

// ─────────────────────────────
// APP INIT
// ─────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;
const now  = () => new Date().toISOString();

// ─────────────────────────────
// CORS
// ─────────────────────────────
const ALLOWED_ORIGINS = [
  "https://od2k24.github.io",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  credentials: false,
};

// Apply CORS before everything else so preflight OPTIONS requests are handled
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // explicit preflight handler for all routes

// ─────────────────────────────
// MIDDLEWARE
// ─────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─────────────────────────────
// GROQ CONFIG
// ─────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL        = "llama-3.3-70b-versatile";

function buildSystemPrompt(goal, context) {
  return [
    "You are Xarvis — an elite AI co-founder and creator strategist.",
    "You help users build businesses, go viral, and make money online.",
    "Be direct, structured, and actionable. Format responses with **bold headers** when helpful.",
    goal    ? `User goal: ${goal}`       : null,
    context ? `Context: ${context}`      : null,
  ].filter(Boolean).join("\n");
}

function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every((m) => m.role && m.content)
  );
}

// ─────────────────────────────
// ROUTES
// ─────────────────────────────

// Root
app.get("/", (_req, res) => {
  res.json({
    name:      "Xarvis API",
    status:    "running 🚀",
    timestamp: now(),
    endpoints: ["/api/health", "/api/ping", "/api/chat", "/api/chat/stream"],
  });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status:        "ok",
    timestamp:     now(),
    uptime:        process.uptime(),
    node:          process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
  });
});

// Ping
app.get("/api/ping", (_req, res) => {
  res.json({ success: true, message: "pong 🟢", timestamp: now() });
});

// ── POST /api/chat  (standard JSON response) ──────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, goal, context } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Missing GROQ_API_KEY", timestamp: now() });
    }
    if (!isValidMessages(messages)) {
      return res.status(400).json({ success: false, error: "Invalid messages format — expected non-empty array of {role, content}", timestamp: now() });
    }

    console.log(`[/api/chat] ${messages.length} message(s), goal="${goal || "none"}"`);

    const groqRes = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       MODEL,
        messages:    [{ role: "system", content: buildSystemPrompt(goal, context) }, ...messages],
        temperature: 0.7,
        max_tokens:  1024,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error("[/api/chat] Groq error:", data?.error);
      return res.status(502).json({ success: false, error: data?.error?.message || "Groq API error", timestamp: now() });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ success: false, error: "Empty model response", timestamp: now() });
    }

    return res.json({ success: true, reply, timestamp: now() });

  } catch (err) {
    console.error("[/api/chat] error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error", timestamp: now() });
  }
});

// ── POST /api/chat/stream  (SSE streaming response) ───────────────────────────
// Emits SSE events: { type:"delta", content } | { type:"done" } | { type:"error", message }
app.post("/api/chat/stream", async (req, res) => {
  const { message, history = [], goal, context } = req.body || {};
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: "Missing GROQ_API_KEY", timestamp: now() });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, error: "message is required", timestamp: now() });
  }

  // SSE headers — must be set before any write
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx buffering on Railway
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const messages = [
    { role: "system", content: buildSystemPrompt(goal, context) },
    ...history.slice(-12),
    { role: "user",   content: message },
  ];

  console.log(`[/api/chat/stream] streaming, history=${history.length} msg(s)`);

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       MODEL,
        messages,
        temperature: 0.75,
        max_tokens:  1024,
        stream:      true,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      console.error("[/api/chat/stream] Groq error:", err?.error);
      send({ type: "error", message: err?.error?.message || `Groq error ${groqRes.status}` });
      return res.end();
    }

    const reader  = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // hold back any incomplete line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") {
          send({ type: "done" });
          return res.end();
        }
        try {
          const parsed = JSON.parse(raw);
          const chunk  = parsed?.choices?.[0]?.delta?.content;
          if (chunk) send({ type: "delta", content: chunk });
        } catch {
          // malformed chunk — skip silently
        }
      }
    }

    send({ type: "done" });
    res.end();

  } catch (err) {
    console.error("[/api/chat/stream] error:", err.message);
    send({ type: "error", message: "Internal server error — please try again." });
    res.end();
  }
});

// ─────────────────────────────
// ERROR HANDLERS
// ─────────────────────────────

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   "Route not found",
    path:    req.originalUrl,
    timestamp: now(),
  });
});

// Global error handler (catches CORS errors and anything thrown by middleware)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[global error]", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error:   err.message || "Internal server error",
    timestamp: now(),
  });
});

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🧠 Node: ${process.version}`);
  console.log(`🔑 GROQ key loaded: ${!!process.env.GROQ_API_KEY}`);
  console.log(`🌐 CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
