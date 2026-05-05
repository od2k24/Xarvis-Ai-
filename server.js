app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are Xarvis AI." },
        ...(messages || []),
      ],
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content || "No response",
    });

  } catch (err) {
    console.error("CHAT ERROR:", err.message);

    res.status(500).json({
      error: "AI temporarily unavailable",
    });
  }
});
