// ============================================
//  XARVIS AI — GEMINI ENGINE (FIXED & UPGRADED)
// ============================================

// 🔥 SYSTEM PROMPT (your AI personality)
const XARVIS_SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators.

You think like:
- Viral strategist
- YouTube growth expert
- TikTok algorithm specialist
- Monetization coach

Your personality:
Direct, energetic, data-driven, motivating.
You cut fluff and give REAL actionable strategies.

Rules:
- Always give numbered steps
- Include hooks/scripts/examples
- Reference real growth tactics
- Use **bold** for key ideas
- Use emojis strategically
- Give predictions when relevant
- End with a clear next step

Mission:
Turn creators into six-figure earners with viral content.`;


// ============================================
// 🔥 MAIN FUNCTION
// ============================================

async function callGemini(messagesHistory) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${XARVIS_CONFIG.GEMINI_MODEL}:generateContent?key=${XARVIS_CONFIG.GEMINI_API_KEY}`;

    // ✅ Convert chat history to Gemini format
    const contents = messagesHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // ✅ CLEAN request body (NO invalid fields)
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${XARVIS_SYSTEM}\n\nUser request:\n${messagesHistory[messagesHistory.length - 1].content}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: XARVIS_CONFIG.TEMPERATURE || 0.7,
        maxOutputTokens: XARVIS_CONFIG.MAX_TOKENS || 800,
        topP: 0.9,
        topK: 40
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // ❌ Handle API errors properly
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Gemini API Error:", errData);

      return `⚠️ Error: ${errData?.error?.message || "Something went wrong."}`;
    }

    const data = await res.json();

    // ✅ Safe extraction
    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return output || "⚠️ No response from AI.";

  } catch (error) {
    console.error("Xarvis Error:", error);

    return "⚠️ Network error. Check your API key or internet.";
  }
}


// ============================================
// 🔥 OPTIONAL: SIMPLE HELPER
// ============================================

async function sendMessage(message) {
  return await callGemini([
    { role: "user", content: message }
  ]);
}
