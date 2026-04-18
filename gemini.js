// ============================================
//  XARVIS AI — GEMINI ENGINE (STABLE CLEAN BUILD)
// ============================================

// 🔥 SYSTEM PROMPT
const XARVIS_SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators.

You give:
- Direct, actionable advice
- Viral strategies
- Monetization plans

Rules:
- Use numbered steps
- Be concise but powerful
- Highlight key ideas with **bold**
- End with a next step

Goal: Help creators grow fast and make money.`;


// ============================================
// 🔥 MAIN FUNCTION
// ============================================

async function callGemini(messagesHistory) {
  try {
    const apiKey = XARVIS_CONFIG.GEMINI_API_KEY;
    const model = XARVIS_CONFIG.GEMINI_MODEL || "gemini-pro";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // ✅ Get latest user message
    const lastMessage = messagesHistory[messagesHistory.length - 1]?.content || "";

    // ✅ Build request
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${XARVIS_SYSTEM}\n\nUser: ${lastMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // ❌ API error handling
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API ERROR:", errorData);

      return "⚠️ API Error — check key or model.";
    }

    const data = await response.json();

    // ✅ Extract response safely
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "⚠️ No response.";

  } catch (error) {
    console.error("XARVIS ERROR:", error);
    return "⚠️ Network error. Check console.";
  }
}


// ============================================
// 🔥 SIMPLE SEND FUNCTION
// ============================================

async function sendMessage(message) {
  return await callGemini([
    { role: "user", content: message }
  ]);
}
