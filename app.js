import { CONFIG } from "./config.js";

let messages = [];
let isSending = false;

// ─── DOM ────────────────────────────────
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatInner = document.getElementById("chat-inner");
const chatContainer = document.getElementById("chat-container");

// ─── INIT ───────────────────────────────
function init() {
  messages = JSON.parse(localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY) || "[]");
  renderMessages();
  setup();
}

function renderMessages() {
  chatInner.innerHTML = "";
  messages.forEach(m => addMessage(m.role, m.content));
}

// ─── UI ────────────────────────────────
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatInner.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ─── API CALL (FIXED) ──────────────────
async function callAPI() {
  const history = messages.slice(-4);

  try {
    return await sendRequest(history);
  } catch (err) {
    // ⏳ Show loading instead of error
    addMessage("assistant", "⏳ Waking up server...");

    // wait for Render to wake
    await new Promise(r => setTimeout(r, 4000));

    // retry
    return await sendRequest(history);
  }
}

// 🔁 actual request logic
async function sendRequest(history) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history.length ? history : []
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  return data.reply;
}

// ─── SEND ──────────────────────────────
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isSending) return;

  isSending = true;
  sendBtn.disabled = true;

  chatInput.value = "";

  messages.push({ role: "user", content: text });
  addMessage("user", text);

  try {
    const reply = await callAPI();

    messages.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);

    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    addMessage("assistant", "⚠️ " + err.message);
  }

  isSending = false;
  sendBtn.disabled = false;
}

// ─── EVENTS ────────────────────────────
function setup() {
  sendBtn.addEventListener("click", sendMessage);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

init();
