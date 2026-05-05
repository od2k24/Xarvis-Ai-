import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── GROQ CLIENT ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt used across all routes
const SYSTEM_PROMPT = `You are Xarvis AI — a world-class AI co-founder for content creators.
You specialise in viral content strategy, YouTube growth, hooks, scripts, monetisation,
and content planning. Be direct, actionable, and high-energy. Speak like a top-tier
strategist who has studied every viral trend. Always give practical, copy-paste-ready output.`;

// Helper: call Groq and return reply string
async function askGroq(messages, max_tokens = 1200) {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    max_tokens,
    temperature: 0.85,
  });
  return completion?.choices?.[0]?.message?.content ?? "";
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "Xarvis AI running 🚀" }));
app.get("/api/health", (req, res) => res.json({ ok: true, status: "online" }));

// ─── /api/chat ────────────────────────────────────────────────────────────────
// Called by the AI Advisor chat panel
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], context = "" } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    // Build message array from history + new message
    const msgs = [
      ...(context ? [{ role: "user", content: `Creator context:${context}` }, { role: "assistant", content: "Got it — I'll tailor everything to your profile." }] : []),
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const reply = await askGroq(msgs, 900);
    res.json({ reply });
  } catch (err) {
    console.error("❌ /api/chat error:", err.message);
    res.status(500).json({ error: "AI temporarily unavailable. Please retry." });
  }
});

// ─── /api/generate ────────────────────────────────────────────────────────────
// Powers: Viral Generator, Post Next, Calendar, Feedback, Agent
app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, platform, content, goal, context = "", memory = {} } = req.body;
    let prompt = "";

    if (type === "viral") {
      if (!topic) return res.status(400).json({ error: "topic is required" });
      prompt = `Generate a complete viral content package for: "${topic}" on ${platform || "YouTube Shorts"}.
${context}
Respond in EXACTLY this format — keep each label on its own line:
HOOK: [A single scroll-stopping opening sentence under 15 words]
SCRIPT: [Full 150-200 word script optimised for retention on this platform]
TITLE: [3 title options, each on a new line, with numbers]
THUMBNAIL: [Describe the perfect thumbnail — text, visual, colours, emotion]`;

    } else if (type === "postnext") {
      prompt = `Based on this creator profile, pick ONE specific video idea they should post today for maximum virality.
${context}
Respond in EXACTLY this format:
IDEA: [Specific video concept in 1-2 sentences]
HOOK: [The exact opening hook — copy-paste ready]
WHY IT WILL WORK: [2-3 sentences on the psychology and trend behind it]
BEST TIME TO POST: [Day and time recommendation with reason]`;

    } else if (type === "calendar") {
      prompt = `Create a 7-day content calendar for this creator:
${context}
Output EXACTLY 7 lines in this pipe-separated format (one per day, no extra text):
DAY 1 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 2 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 3 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 4 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 5 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 6 | [Topic title] | [Unique angle] | [Hook sentence]
DAY 7 | [Topic title] | [Unique angle] | [Hook sentence]`;

    } else if (type === "feedback") {
      if (!content) return res.status(400).json({ error: "content is required" });
      prompt = `Analyse this video idea as a world-class content strategist:
"${content}"
${context}
Respond in EXACTLY this format:
STRENGTHS: [3 bullet points on what works — be specific]
WEAKNESSES: [3 bullet points on what could kill performance]
IMPROVEMENTS: [3 concrete, actionable fixes — copy-paste suggestions]
VIRAL SCORE: [X/10]
VERDICT: [1-2 sentences — be honest and direct]`;

    } else if (type === "agent") {
      if (!goal) return res.status(400).json({ error: "goal is required" });
      prompt = `You are in AGENT MODE. The creator's big goal: "${goal}"
${context}
Build a complete, numbered execution roadmap. Include:
1. Phase breakdown (Week 1-4 / Month 1-3)
2. Daily action items
3. Content strategy
4. Monetisation milestones
5. Key metrics to track
Be extremely specific and actionable. This is their blueprint.`;

    } else {
      return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    const reply = await askGroq([{ role: "user", content: prompt }], 1400);
    res.json({ reply });
  } catch (err) {
    console.error("❌ /api/generate error:", err.message);
    res.status(500).json({ error: "Generation failed. Please retry." });
  }
});

// ─── /api/agent/plan ─────────────────────────────────────────────────────────
// Dedicated agent endpoint (also handled via /api/generate type:agent above)
app.post("/api/agent/plan", async (req, res) => {
  try {
    const { goal, context = "" } = req.body;
    if (!goal) return res.status(400).json({ error: "goal is required" });

    const prompt = `AGENT MODE — Big goal: "${goal}"\n${context}\nBuild a complete numbered execution roadmap with phases, daily actions, content strategy, monetisation milestones, and key metrics.`;
    const plan = await askGroq([{ role: "user", content: prompt }], 1600);
    res.json({ plan });
  } catch (err) {
    console.error("❌ /api/agent/plan error:", err.message);
    res.status(500).json({ error: "Agent planning failed. Please retry." });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
// FIX: use PORT 3001 locally to match frontend expectation
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Xarvis AI server running on port ${PORT}`));
