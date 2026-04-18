const XARVIS_SYSTEM = `You are Xarvis AI — an elite AI co-founder for content creators.

Give direct, actionable, viral strategies.
Use bold key ideas and numbered steps.
End with a clear next step.`;

async function callXarvisAPI(message) {
  const apiKey = localStorage.getItem("xarvis_gemini_key");

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${XARVIS_SYSTEM}\n\nUser: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("API ERROR:", err);
    throw new Error(err?.error?.message || "API_ERROR");
  }

  const data = await response.json();

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}
