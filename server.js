const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ FIX: ensure fetch works on all Node versions
// ✅ Fetch fix (works on all Node versions)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ HEALTH CHECK
// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nodeVersion: process.version,
    nativeFetch: typeof fetch !== "undefined",
  });
});

// CONFIG
// ─── Config ──────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildSystemPrompt(goal) {
  return `You are Xarvis — an elite AI co-founder.
- Give actionable steps
- Be concise
- Focus on making money and growth
${goal ? `User goal: ${goal}` : ""}`;
  return [
    "You are Xarvis — an elite AI co-founder.",
    "- Give actionable steps",
@@ -44,73 +36,51 @@ ${goal ? `User goal: ${goal}` : ""}`;
    .join("\n");
}

// ✅ CHAT ROUTE (FULLY FIXED)
// ─── Chat Route ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    nodeVersion: process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nativeFetch: typeof fetch !== "undefined",
  });
});

// ─────────────────────────────────────────────
// Chat Route (FIXED + CLEAN)
// ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    console.log("📩 Incoming body:", req.body);
  // Step 1: Validate API key exists
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in environment");
    return res.status(500).json({
      error: "Server misconfiguration: missing API key",
    });
  }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing GROQ_API_KEY");
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }
  // Step 2: Validate request body
  const { messages, goal } = req.body ?? {};

    // ✅ FIX: safe destructuring
    const { messages = [], goal } = req.body;
  if (!messages) {
    return res.status(400).json({ error: "Request body must include messages" });
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Missing GROQ_API_KEY in environment" });
  }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }
  const { messages = [], goal } = req.body || {};

  if (messages.length === 0) {
    return res.status(400).json({ error: "messages array cannot be empty" });
  }

  // Step 3: Validate native fetch is available (Node 18+ on Railway)
  if (typeof fetch === "undefined") {
    console.error("❌ Native fetch not available — Railway must be using Node < 18");
    return res.status(500).json({
      error: "Server error: fetch not available. Contact admin to upgrade Node.",
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "messages must be a non-empty array",
    });
  }

  // Step 4: Call Groq with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn("⏱️ Groq request timed out after 20s");
  }, 20000);

    // ✅ OPTIONAL: timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
  let groqResponse;
  try {
    console.log(`📩 /api/chat — goal: "${goal}" — messages: ${messages.length}`);
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_API_URL, {
    groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
@@ -66,51 +91,66 @@ app.post("/api/chat", async (req, res) => {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(goal) },
          ...messages,
        ],
@@ -119,88 +89,52 @@ app.post("/api/chat", async (req, res) => {
      }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);

    clearTimeout(timeout);

    const data = await response.json();

    console.log("🤖 Groq response:", data);

    if (!response.ok) {
      console.error("❌ Groq error:", data);
      return res.status(500).json({
        error: data?.error?.message || "Groq API failed",
      return res.status(502).json({
        error: data?.error?.message || "Groq API error",
      });
    if (fetchErr.name === "AbortError") {
      console.error("❌ Groq request aborted (timeout)");
      return res.status(504).json({ error: "Groq API timed out. Try again." });
    }

    const reply =
      data?.choices?.[0]?.message?.content || "No response from model";
    const reply = data?.choices?.[0]?.message?.content;

    res.json({ reply });
    console.error("❌ Network error reaching Groq:", fetchErr.message);
    return res.status(502).json({
      error: `Cannot reach Groq API: ${fetchErr.message}`,
    });
  }
    if (!reply) {
      return res
        .status(502)
        .json({ error: "Empty response from Groq" });
    }

    return res.json({ reply });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
  clearTimeout(timeoutId);
    clearTimeout(timeout);

    // ✅ Better error messages
    if (err.name === "AbortError") {
      return res.status(500).json({ error: "Request timeout" });
      return res.status(504).json({ error: "Request timed out" });
    }
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

    res.status(500).json({
      error: err.message || "Server crashed",
  // Step 6: Check Groq HTTP status
  if (!groqResponse.ok) {
    const groqError = data?.error?.message ?? "Unknown Groq error";
    console.error(`❌ Groq HTTP ${groqResponse.status}:`, groqError);
    return res.status(502).json({
      error: `Groq API error (${groqResponse.status}): ${groqError}`,
    return res.status(500).json({
      error: "Server error: " + err.message,
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

// ✅ STATIC FILES
// ─── Static Files ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────
// Static Frontend (GitHub / Railway safe)
// ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ✅ FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START
// ─── Start ────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
  console.log(`🚀 Xarvis running on port ${PORT} | Node ${process.version}`);
  console.log(`Node: ${process.version}`);
});
