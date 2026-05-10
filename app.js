const CONFIG = {
  API_BASE_URL: "https://xarvis-ai.onrender.com"
};

// ─── STATE ─────────────────────────────────────────────────────────────
let messages = [];

// ─── ELEMENTS ──────────────────────────────────────────────────────────
const input = document.getElementById("messageInput");
const chatContainer = document.getElementById("chatContainer");
const sendBtn = document.getElementById("sendBtn");

// ─── ADD MESSAGE TO UI ─────────────────────────────────────────────────
function addMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  msgDiv.innerHTML = `
    <div class="bubble">
      ${text}
    </div>
  `;

  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  messages.push({
    role,
    content: text
  });
}

// ─── SEND MESSAGE ──────────────────────────────────────────────────────
async function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  addMessage("user", text);

  input.value = "";

  try {
    const reply = await callAPI();

    addMessage("assistant", reply);

  } catch (err) {
    console.error(err);

    addMessage(
      "assistant",
      "❌ Xarvis AI failed to respond. Please retry."
    );
  }
}

// ─── API CALL ──────────────────────────────────────────────────────────
async function callAPI() {

  const history = messages.slice(-10);

  return await sendWithRetry(history, 2);
}

// ─── RETRY SYSTEM ──────────────────────────────────────────────────────
async function sendWithRetry(history, retries) {

  try {
    return await sendRequest(history);

  } catch (err) {

    console.error("Retry error:", err);

    if (retries > 0) {

      addMessage(
        "assistant",
        "⏳ Waking up Xarvis AI..."
      );

      await new Promise(r => setTimeout(r, 2500));

      return sendWithRetry(history, retries - 1);
    }

    throw err;
  }
}

// ─── FETCH REQUEST ────────────────────────────────────────────────────
async function sendRequest(history) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);

  try {

    const latestMessage =
      history[history.length - 1]?.content || "";

    const res = await fetch(
      `${CONFIG.API_BASE_URL}/api/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: latestMessage,
          history
        }),

        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Server error"
      );
    }

    return data.reply;

  } catch (err) {

    if (err.name === "AbortError") {
      throw new Error(
        "Server timeout. Render may be waking up."
      );
    }

    throw err;
  }
}

// ─── ENTER TO SEND ─────────────────────────────────────────────────────
input.addEventListener("keydown", (e) => {

  if (e.key === "Enter" && !e.shiftKey) {

    e.preventDefault();

    sendMessage();
  }
});

// ─── BUTTON CLICK ──────────────────────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);

// ─── STARTUP MESSAGE ───────────────────────────────────────────────────
addMessage(
  "assistant",
  "🚀 Xarvis AI online. Ask me anything about viral content, YouTube growth, monetisation, or creator strategy."
);
