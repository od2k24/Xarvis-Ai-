// ─── API CALL (ROBUST SYSTEM) ─────────
async function callAPI() {
  const history = messages.slice(-6);

  return await sendWithRetry(history, 3);
}

// 🔁 retry wrapper
async function sendWithRetry(history, retries) {
  try {
    return await sendRequest(history);
  } catch (err) {
    if (retries > 0) {
      addMessage("assistant", "⏳ Waking up Xarvis AI...");
      await new Promise(r => setTimeout(r, 3000));
      return sendWithRetry(history, retries - 1);
    }
    throw err;
  }
}

// ⏱️ safe fetch with timeout
async function sendRequest(history) {
  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Server error");
    }

    return data.reply;

  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Server is waking up... please retry");
    }
    throw err;
  }
}
