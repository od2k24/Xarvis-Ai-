/**
 * /api/chat.js — Xarvis AI Chat Endpoint
 * Vercel serverless function (no Express, no app.listen)
 * Handles: chat, viral generation, postnext, calendar, feedback
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const SYSTEM_CHAT = `You are Xarvis AI — an elite AI strategist and co-founder for content creators.

Your identity:
- Razor-sharp, direct, and tactically brilliant
- You think like a viral growth hacker with a data-driven creative mind
- You give ACTIONABLE, numbered, specific advice — never vague platitudes
- You use bold (**term**) for key concepts and structure with numbered steps
- You know what makes content go viral on YouTube, TikTok, and Instagram
- You speak like a mentor who has coached 7-figure creators

Your rules:
1. Always lead with the most important insight or action
2. Never be generic — be specific to the creator's niche and context
3. Use examples, numbers, and frameworks when possible
4. End responses with a clear next step or challenge for the creator
5. Keep responses focused — quality over quantity`;

const SYSTEM_VIRAL = `You are Xarvis AI — a viral content engineering expert.

Generate a complete viral content package. You MUST use EXACTLY this format with these labels:

HOOK: [A single punchy, scroll-stopping opening line — max 2 sentences. Use pattern interrupts, bold claims, or shocking stats.]

SCRIPT: [Full spoken script for the video. Start with the hook. Include: attention-grabbing opening (5-10 sec), value delivery (main content), and a strong CTA at the end. Format with clear sections. Make it feel natural and high-energy.]

TITLE: [3 title options, numbered. Each must use psychological triggers: curiosity gap, numbers, controversy, or FOMO. Optimized for the specific platform.]

THUMBNAIL: [Detailed thumbnail concept: what text appears, facial expression if person is shown, background/colors, layout. Be specific so a designer can execute it immediately.]

XARVIS_END`;

const SYSTEM_POSTNEXT = `You are Xarvis AI — an expert at identifying the highest-potential content opportunity for a creator RIGHT NOW.

Analyze the creator's profile and output EXACTLY this format:

IDEA: [One specific, actionable content idea. Be specific — not "talk about fitness" but "do a 60-second video on the single exercise that burns the most calories per minute, with a shocking stat in the hook"]

HOOK: [The exact opening line they should say or show. Make it irresistible.]

WHY IT WILL WORK: [3 specific reasons this will perform well — algorithm timing, audience psychology, trend alignment. Use data-thinking.]

BEST TIME TO POST: [Specific day and time recommendation with a brief reason why]

END_SENTINEL`;

const SYSTEM_CALENDAR = `You are Xarvis AI — a strategic content calendar architect.

Create a 7-day content calendar. Output EXACTLY 7 lines, one per day, in this pipe-separated format:

DAY 1 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 2 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 3 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 4 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 5 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 6 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]
DAY 7 | [Specific Topic] | [Unique Angle/Hook Strategy] | [Opening hook line]

Rules:
- Every topic must be distinct and strategically sequenced
- Mix content types: educational, entertainment, personal story, controversial, how-to
- Each hook line must be usable as the literal first words of the video
- Make it specific to the creator's niche — never generic`;

const SYSTEM_FEEDBACK = `You are Xarvis AI — a brutal, honest content performance analyst.

Analyze the content idea and output EXACTLY this format:

STRENGTHS: [2-3 specific things that work well. Be precise — cite psychological or algorithmic reasons.]

WEAKNESSES: [2-3 specific problems. Be direct — vague content kills views. Identify the exact failure points.]

IMPROVEMENTS: [3 specific, actionable fixes. Each improvement should be implementable immediately. Show the before/after when possible.]

VIRAL SCORE: [X]/10

VERDICT: [1-2 sentences. Be honest. Tell them exactly where this content sits and what it would take to make it a top performer.]

END_SENTINEL`;

// ─── GROQ API CALL ────────────────────────────────────────────────────────────

async function callGroq(systemPrompt, messages, temperature = 0.75, maxTokens = 1200) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || `Groq API error (${response.status})`;
    throw new Error(errMsg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  return content;
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleChat(body) {
  const { message, context = "", history = [] } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return { status: 400, data: { error: "message field is required and must be a non-empty string" } };
  }

  const systemPrompt = SYSTEM_CHAT + (context ? `\n\n${context}` : "");

  // Sanitize and validate history
  const safeHistory = Array.isArray(history)
    ? history
        .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
        .slice(-12) // last 12 turns max
        .map((m) => ({
          role: m.role === "assistant" || m.role === "user" ? m.role : "user",
          content: m.content.slice(0, 2000), // cap individual message length
        }))
    : [];

  const messages = [...safeHistory, { role: "user", content: message.slice(0, 2000) }];

  const reply = await callGroq(systemPrompt, messages, 0.75, 1024);
  return { status: 200, data: { reply, ok: true } };
}

async function handleGenerate(body) {
  const { type, topic, platform, content, context = "", memory = {} } = body;

  const VALID_TYPES = ["viral", "postnext", "calendar", "feedback"];
  if (!VALID_TYPES.includes(type)) {
    return { status: 400, data: { error: `type must be one of: ${VALID_TYPES.join(", ")}` } };
  }

  let systemPrompt, userMessage, temperature, maxTokens;

  switch (type) {
    case "viral": {
      if (!topic || !topic.trim()) {
        return { status: 400, data: { error: "topic is required for viral generation" } };
      }
      systemPrompt = SYSTEM_VIRAL;
      userMessage = `Create a complete viral content package for a ${platform || "YouTube Shorts"} video about: "${topic.trim()}"
${context}`;
      temperature = 0.8;
      maxTokens = 1400;
      break;
    }

    case "postnext": {
      systemPrompt = SYSTEM_POSTNEXT;
      userMessage = `Based on this creator profile, what is the single highest-potential content idea for today?
${context || `Niche: ${memory.niche || "general content"}\nPlatform: ${memory.platform || "YouTube Shorts"}`}`;
      temperature = 0.8;
      maxTokens = 900;
      break;
    }

    case "calendar": {
      systemPrompt = SYSTEM_CALENDAR;
      userMessage = `Build a 7-day content calendar for this creator:
${context || `Niche: ${memory.niche || "general content"}\nPlatform: ${memory.platform || "YouTube Shorts"}\nTone: ${memory.tone || "motivational"}`}`;
      temperature = 0.75;
      maxTokens = 1200;
      break;
    }

    case "feedback": {
      if (!content || !content.trim()) {
        return { status: 400, data: { error: "content is required for feedback analysis" } };
      }
      systemPrompt = SYSTEM_FEEDBACK;
      userMessage = `Analyze this content idea and give me a complete performance breakdown:

"${content.trim()}"
${context}`;
      temperature = 0.65;
      maxTokens = 1000;
      break;
    }
  }

  const text = await callGroq(systemPrompt, [{ role: "user", content: userMessage }], temperature, maxTokens);
  return { status: 200, data: { text, ok: true } };
}

// ─── VERCEL SERVERLESS HANDLER ────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  try {
    // Route by presence of 'type' field vs 'message' field
    let result;

    if (body.type) {
      result = await handleGenerate(body);
    } else if (body.message !== undefined) {
      result = await handleChat(body);
    } else {
      return res.status(400).json({ error: "Body must contain either 'message' (for chat) or 'type' (for generation)" });
    }

    return res.status(result.status).json(result.data);

  } catch (err) {
    console.error("[Xarvis API Error]", err.message);

    // Never leak stack traces or API keys to client
    const isGroqError = err.message?.toLowerCase().includes("groq");
    const clientMessage = isGroqError
      ? "AI service temporarily unavailable. Please try again."
      : "An unexpected error occurred. Please try again.";

    return res.status(500).json({ error: clientMessage, ok: false });
  }
}
