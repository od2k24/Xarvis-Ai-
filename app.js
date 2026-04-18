// ============================================
//  XARVIS AI — APP LOGIC (UPDATED v2)
//  Cleaner state, safer guards, improved UX
// ============================================

// ─────────────────────────────────────────────
// CONFIG (fallback if external config missing)
// ─────────────────────────────────────────────
const XARVIS_CONFIG = window.XARVIS_CONFIG || {
  FREE_MSG_LIMIT: 15,
  API_URL: null // set in config.js if needed
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let messages = [];
let recentChats = [];
let ttsEnabled = true;
let isListening = false;
let recognition = null;
let selectedPlan = "starter";
let msgCount = 0;
let isPro = false;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const plan = new URLSearchParams(location.search).get("plan");
  if (plan === "pro" || plan === "elite") activatePlan(plan, true);

  loadRecentChats();
  renderRecentChats();
  updateLimitBanner();
  bindSuggestions();
});

// ─────────────────────────────────────────────
// SEND MESSAGE (CORE FIXED)
// ─────────────────────────────────────────────
async function sendMessage(prefill) {
  const input = document.getElementById("chat-input");
  if (!input) return;

  const userText = (prefill || input.value || "").trim();
  if (!userText) return;

  // limit check
  if (!isPro && msgCount >= XARVIS_CONFIG.FREE_MSG_LIMIT) {
    openUpgradeModal();
    return;
  }

  hideEmptyState();

  input.value = "";
  autoResize(input);

  pushMessage("user", userText);

  msgCount++;
  updateLimitBanner();

  setSendDisabled(true);
  const typing = showTyping();

  try {
    const reply = await callGemini(messages);

    typing.remove();
    pushMessage("bot", reply);

    if (ttsEnabled) speak(reply);
    saveRecentChat(userText);

  } catch (err) {
    typing.remove();
    pushMessage(
      "bot",
      "⚠️ Something went wrong. Check your API config or try again."
    );
    console.error(err);
  }

  setSendDisabled(false);
  scrollBottom();
}

// ─────────────────────────────────────────────
// MESSAGE SYSTEM
// ─────────────────────────────────────────────
function pushMessage(role, text) {
  messages.push({ role, content: text });
  renderMessage(role, text);
}

function renderMessage(role, text) {
  const area = document.getElementById("chat-area");
  if (!area) return;

  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = `msg-avatar ${role === "bot" ? "bot" : "user-av"}`;
  avatar.textContent = role === "bot" ? "X" : "Y";

  const bubble = document.createElement("div");
  bubble.className = `msg-bubble ${role}`;
  bubble.innerHTML = formatText(text);

  row.appendChild(avatar);
  row.appendChild(bubble);
  area.appendChild(row);

  scrollBottom();
}

function formatText(t) {
  return String(t)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

// ─────────────────────────────────────────────
// TYPING
// ─────────────────────────────────────────────
function showTyping() {
  const area = document.getElementById("chat-area");
  if (!area) return;

  const row = document.createElement("div");
  row.className = "message-row";

  row.innerHTML = `
    <div class="msg-avatar bot">X</div>
    <div class="msg-bubble bot">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;

  area.appendChild(row);
  scrollBottom();
  return row;
}

// ─────────────────────────────────────────────
// CHAT CONTROL
// ─────────────────────────────────────────────
function newChat() {
  messages = [];
  const area = document.getElementById("chat-area");
  if (area) area.innerHTML = buildEmptyState();
  bindSuggestions();
}

function hideEmptyState() {
  document.getElementById("empty-state")?.remove();
}

// ─────────────────────────────────────────────
// SUGGESTIONS
// ─────────────────────────────────────────────
function bindSuggestions() {
  document.querySelectorAll(".suggestion-card").forEach(el => {
    el.onclick = () => sendMessage(el.dataset.prompt);
  });
}

function buildEmptyState() {
  return `
  <div class="empty-state" id="empty-state">
    <h2>Your AI Co-Founder is Ready.</h2>
    <p>Tell Xarvis your niche and goals.</p>
  </div>`;
}

// ─────────────────────────────────────────────
// RECENT CHATS
// ─────────────────────────────────────────────
function saveRecentChat(text) {
  const label = text.length > 40 ? text.slice(0, 40) + "…" : text;
  recentChats.unshift(label);
  recentChats = recentChats.slice(0, 10);

  localStorage.setItem("xarvis_recent", JSON.stringify(recentChats));
  renderRecentChats();
}

function loadRecentChats() {
  try {
    recentChats = JSON.parse(localStorage.getItem("xarvis_recent") || "[]");
  } catch {
    recentChats = [];
  }
}

function renderRecentChats() {
  const el = document.getElementById("recent-chats");
  if (!el) return;

  el.innerHTML = recentChats.length
    ? recentChats.map((c, i) =>
        `<div class="recent-chat-item ${i === 0 ? "active" : ""}">${c}</div>`
      ).join("")
    : `<div class="muted">No chats yet</div>`;
}

// ─────────────────────────────────────────────
// LIMIT SYSTEM FIXED
// ─────────────────────────────────────────────
function updateLimitBanner() {
  co
