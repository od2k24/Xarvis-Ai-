async function callGroq(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: messages[messages.length - 1].content,
      history: messages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  return data.reply;
}
