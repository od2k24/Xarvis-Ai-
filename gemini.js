// ============================================
//  XARVIS AI — GEMINI ENGINE
// ============================================

const XARVIS_SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators. You think like a viral strategist, YouTube growth expert, TikTok algorithm specialist, and monetization coach all in one.

Your personality: Direct, energetic, data-driven, motivating. You cut through fluff and give REAL actionable strategies. You use bold formatting (**bold**) to highlight key insights. You reference real numbers, timeframes, and platforms.

When helping creators:
- Always give specific numbered action steps
- Include hooks, scripts, or examples when relevant  
- Reference current platform trends and algorithm behavior
- Bold key terms using **bold**
- Use emojis strategically (not excessively)
- Give virality scores or predictions when asked
- Always end with a clear next step or call to action

You are speaking to a creator who wants to go from where they are NOW to six-figure income and viral growth. Be their unfair advantage.`;

async function callGemini(messagesHistory) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${XARVIS_CONFIG.GEMINI_MODEL}:generateContent?key=${XARVIS_CONFIG.GEMINI_API_KEY}`;

  // Convert chat history to Gemini format
  const contents = messagesHistory.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const body = {
    system_instruction: { parts: [{ text: XARVIS_SYSTEM }] },
    contents,
    generationConfig: {
      maxOutputTokens: XARVIS_CONFIG.MAX_TOKENS,
      temperature:     XARVIS_CONFIG.TEMPERATURE,
    }
  };

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text
    || "I didn't get a response. Try again.";
}
