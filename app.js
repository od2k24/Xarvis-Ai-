// ─── API CALL (ROBUST VERSION) ─────────
async function callAPI() {
  const history = messages.slice(-6);

  return await sendRequestWithRetry(history, 3);
}

// 🔁 retry system with timeout
async function sendRequestWithRetry(history, retries) {
  try {
    return await sendRequest(history);
  } catch (err) {
    if (retries > 0) {
      addMessage("assistant", "⏳ Xarvis is waking up...");
      await new Promise(r => setTimeout(r, 3000));
      return sendRequestWithRetry(history, retries - 1);
    }
    throw err;
  }
}

// ⏱️ timeout-safe fetch
async function sendRequest(history) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 20000); // 20s timeout

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
      throw new Error("Server took too long to respond (waking up...)");
    }
    throw err;
  }
}
