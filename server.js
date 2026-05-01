const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nodeVersion: process.version,
    nativeFetch: typeof fetch !== "undefined",
  });
});

// ─── Config ──────────────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(goal) {
  return [
    "You are Xarvis — an elite AI co-founder.",
    "- Give actionable steps",
    "- Be concise",
    "- Focus on making money and growth",
    goal ? `User goal: ${goal}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Chat Route ──────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  // Step 1: Validate API key exists
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in environment");
    return res.status(500).json({
      error: "Server misconfiguration: missing API key",
    });
  }

  // Step 2: Validate request body
  const { messages, goal } = req.body ?? {};

  if (!messages) {
    return res.status(400).json({ error: "Request body must include messages" });
  }

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: "messages array cannot be empty" });
  }

  // Step 3: Validate native fetch is available (Node 18+ on Railway)
  if (typeof fetch === "undefined") {
    console.error("❌ Native fetch not available — Railway must be using Node < 18");
    return res.status(500).json({
      error: "Server error: fetch not available. Contact admin to upgrade Node.",
    });
  }

  // Step 4: Call Groq with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn("⏱️ Groq request timed out after 20s");
  }, 20000);

  let groqResponse;
  try {
    console.log(`📩 /api/chat — goal: "${goal}" — messages: ${messages.length}`);

    groqResponse = await fetch(GROQ_API_URL, {
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
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);

    if (fetchErr.name === "AbortError") {
      console.error("❌ Groq request aborted (timeout)");
      return res.status(504).json({ error: "Groq API timed out. Try again." });
    }

    console.error("❌ Network error reaching Groq:", fetchErr.message);
    return res.status(502).json({
      error: `Cannot reach Groq API: ${fetchErr.message}`,
    });
  }

  clearTimeout(timeoutId);

  // Step 5: Parse Groq response body
  let data;
  try {
    data = await groqResponse.json();
  } catch (parseErr) {
    console.error("❌ Groq returned non-JSON body:", parseErr.message);
    return res.status(502).json({
      error: "Groq returned an unreadable response",
    });
  }

  // Step 6: Check Groq HTTP status
  if (!groqResponse.ok) {
    const groqError = data?.error?.message ?? "Unknown Groq error";
    console.error(`❌ Groq HTTP ${groqResponse.status}:`, groqError);
    return res.status(502).json({
      error: `Groq API error (${groqResponse.status}): ${groqError}`,
    });
  }

  // Step 7: Extract reply
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    console.error("❌ Groq responded OK but returned no content:", data);
    return res.status(502).json({ error: "Groq returned an empty response" });
  }

  console.log(`✅ Reply generated (${reply.length} chars)`);
  return res.json({ reply });
});

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT} | Node ${process.version}`);
});
