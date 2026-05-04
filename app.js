import { CONFIG } from "./config.js";

let messages = [];
let isSending = false;

// ─── DOM ─────────────────────────────────────
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatInner = document.getElementById("chat-inner");
const chatContainer = document.getElementById("chat-container");

// ─── INIT ────────────────────────────────────
function init() {
  messages = JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY) || "[]");
  renderMessages();
  setupEvents();
}

function renderMessages() {
  chatInner.innerHTML = "";
  messages.forEach((m) => addMessage(m.role, m.content));
}

// ─── UI ──────────────────────────────────────
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatInner.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ─── API CALL ────────────────────────────────
async function callAPI() {
  const res = await fetch(`${CONFIG.API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.slice(-10),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  return data.reply;
}

// ─── SEND MESSAGE ────────────────────────────
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

    localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(messages));
  } catch (err) {
    addMessage("assistant", "⚠️ " + err.message);
  }

  isSending = false;
  sendBtn.disabled = false;
}

// ─── EVENTS ──────────────────────────────────
function setupEvents() {
  sendBtn.addEventListener("click", sendMessage);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

init();
