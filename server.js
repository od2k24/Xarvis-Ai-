app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.log("❌ NO API KEY FOUND");
      return res.status(500).json({ error: "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" });
    }

    const { messages, goal } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const systemPrompt = buildSystemPrompt(goal);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ GROQ ERROR:", data);
      return res.status(500).json({ error: data });
    }

    // ✅ Send clean response back
    res.json({
      reply: data.choices?.[0]?.message?.content || "No response",
    });

  } catch (err) {
    console.error("🔥 SERVER CRASH:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});
