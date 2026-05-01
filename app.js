import { CONFIG } from "./config.js";

let userGoal = "";
let messages = [];
let isStreaming = false;

// ─── DOM ────────────────────────────────────────────────
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatInner = document.getElementById("chat-inner");
const chatContainer = document.getElementById("chat-container");

// ─── INIT ───────────────────────────────────────────────
function init() {
  userGoal = localStorage.getItem(CONFIG.GOAL_STORAGE_KEY) || "";
  messages = JSON.parse(localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY) || "[]");

  renderAll();
  setup();
}

function renderAll() {
  chatInner.innerHTML = "";

  messages.forEach((m) => {
    addMessage(m.role, m.content);
  });
}

// ─── UI MESSAGE ─────────────────────────────────────────
function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  chatInner.appendChild(el);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ─── API CALL ───────────────────────────────────────────
async function callAPI(message, history) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      context: userGoal,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Server error");
  }

  return data.reply;
}

// ─── SEND MESSAGE ───────────────────────────────────────
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  isStreaming = true;

  chatInput.value = "";
  sendBtn.disabled = true;

  messages.push({ role: "user", content: text });
  addMessage("user", text);

  try {
    const reply = await callAPI(
      text,
      messages.slice(-10)
    );

    messages.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);

    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    addMessage("assistant", "⚠️ " + err.message);
  }

  isStreaming = false;
  sendBtn.disabled = false;
}

// ─── EVENTS ─────────────────────────────────────────────
function setup() {
  sendBtn.addEventListener("click", sendMessage);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

init();
