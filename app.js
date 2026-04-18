// ============================================
//  XARVIS AI — APP LOGIC
// ============================================

let messages    = [];
let recentChats = [];
let ttsEnabled  = true;
let isListening = false;
let recognition = null;
let selectedPlan = "pro";
let msgCount    = 0;
let isPro       = false;

// ── Init ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Check URL plan param (from pricing page links)
  const plan = new URLSearchParams(window.location.search).get("plan");
  if (plan === "pro" || plan === "elite") activatePlan(plan, true);

  loadRecentChats();
  renderRecentChats();
  updateLimitBanner();
});

// ── Send Message ──────────────────────────────
async function sendMessage(prefill) {
  const input    = document.getElementById("chat-input");
  const userText = (prefill || input.value).trim();
  if (!userText) return;

  if (!isPro && msgCount >= XARVIS_CONFIG.FREE_MSG_LIMIT) {
    openUpgradeModal(); return;
  }

  // Hide empty state
  const es = document.getElementById("empty-state");
  if (es) es.style.display = "none";

  input.value = "";
  autoResize(input);

  messages.push({ role: "user", content: userText });
  renderMessage("user", userText);
  msgCount++;
  updateLimitBanner();

  document.getElementById("send-btn").disabled = true;
  const typing = showTyping();

  try {
    const reply = await callGemini(messages);
    typing.remove();
    messages.push({ role: "assistant", content: reply });
    renderMessage("bot", reply);
    if (ttsEnabled) speak(reply);
    saveRecentChat(userText);
  } catch (err) {
    typing.remove();
    renderMessage("bot",
      `⚠️ **Error:** ${err.message || "Something went wrong."}\n\nMake sure your API key in **js/config.js** is valid.`
    );
  }

  document.getElementById("send-btn").disabled = false;
  scrollBottom();
}

// ── Render Message ────────────────────────────
function renderMessage(role, text) {
  const area = document.getElementById("chat-area");
  const row  = document.createElement("div");
  row.className = `message-row${role === "user" ? " user" : ""}`;

  const av = document.createElement("div");
  av.className = `msg-avatar ${role === "bot" ? "bot" : "user-av"}`;
  av.textContent = role === "bot" ? "X" : "Y";

  const bubble = document.createElement("div");
  bubble.className = `msg-bubble ${role === "bot" ? "bot" : "user"}`;
  bubble.innerHTML = fmt(text);

  row.appendChild(av);
  row.appendChild(bubble);
  area.appendChild(row);
  scrollBottom();
}

function fmt(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

function showTyping() {
  const area = document.getElementById("chat-area");
  const row  = document.createElement("div");
  row.className = "message-row";

  const av = document.createElement("div");
  av.className = "msg-avatar bot";
  av.textContent = "X";

  const b = document.createElement("div");
  b.className = "msg-bubble bot";
  b.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

  row.appendChild(av);
  row.appendChild(b);
  area.appendChild(row);
  scrollBottom();
  return row;
}

// ── New Chat ──────────────────────────────────
function newChat() {
  messages = [];
  const area = document.getElementById("chat-area");
  area.innerHTML = buildEmptyState();
  bindSuggestions();
}

function buildEmptyState() {
  return `<div class="empty-state" id="empty-state">
    <div>
      <h2>Your AI Co-Founder is Ready.</h2>
      <p>Tell Xarvis your niche, your goals, and where you're at — and get a real strategy in seconds.</p>
    </div>
    <div class="suggestion-grid">
      <div class="suggestion-card" data-prompt="I'm a fitness creator on TikTok with 12k followers. Build me a 100k in 90 days plan."><div class="sug-icon">💪</div><div class="sug-title">Fitness Growth Plan</div><div class="sug-desc">100k followers in 90 days blueprint</div></div>
      <div class="suggestion-card" data-prompt="Write 5 viral hooks for a cooking channel on YouTube Shorts"><div class="sug-icon">🍳</div><div class="sug-title">Viral Cooking Hooks</div><div class="sug-desc">5 proven hooks for your cooking channel</div></div>
      <div class="suggestion-card" data-prompt="I have 50k subscribers. Build me a monetization strategy to turn them into real income."><div class="sug-icon">💰</div><div class="sug-title">Monetization Strategy</div><div class="sug-desc">Turn 50k subs into real income</div></div>
      <div class="suggestion-card" data-prompt="Create a 7-day viral TikTok content calendar for a lifestyle creator"><div class="sug-icon">📅</div><div class="sug-title">TikTok Content Calendar</div><div class="sug-desc">7-day viral posting schedule</div></div>
    </div>
  </div>`;
}

function bindSuggestions() {
  document.querySelectorAll(".suggestion-card").forEach(el => {
    el.onclick = () => sendMessage(el.dataset.prompt);
  });
}

// ── Quick Actions ─────────────────────────────
function usePrompt(text) { sendMessage(text); }

// ── Recent Chats ──────────────────────────────
function saveRecentChat(text) {
  const label = text.length > 38 ? text.slice(0, 38) + "…" : text;
  recentChats.unshift(label);
  if (recentChats.length > 10) recentChats.pop();
  try { localStorage.setItem("xarvis_recent", JSON.stringify(recentChats)); } catch(e){}
  renderRecentChats();
}

function loadRecentChats() {
  try { recentChats = JSON.parse(localStorage.getItem("xarvis_recent") || "[]"); } catch(e){}
}

function renderRecentChats() {
  const el = document.getElementById("recent-chats");
  if (!el) return;
  el.innerHTML = recentChats.length
    ? recentChats.map((c, i) => `<div class="recent-chat-item${i===0?" active":""}">${c}</div>`).join("")
    : `<div style="padding:8px 10px;color:var(--muted2);font-size:0.8rem;">No chats yet</div>`;
}

// ── Limit Banner ──────────────────────────────
function updateLimitBanner() {
  const banner = document.getElementById("limit-banner");
  const count  = document.getElementById("msg-count");
  if (!banner) return;
  if (isPro) { banner.classList.add("hidden"); return; }
  if (count) count.textContent = msgCount;
  banner.classList.toggle("hidden", msgCount < XARVIS_CONFIG.FREE_MSG_LIMIT);
}

// ── TTS ───────────────────────────────────────
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  ["tts-btn","tts-btn-top"].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    b.textContent = ttsEnabled ? "🔊 TTS" : "🔇 TTS";
    b.classList.toggle("active", ttsEnabled);
  });
}

function speak(text) {
  if (!ttsEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/<[^>]+>/g,"").replace(/\*\*/g,"").slice(0, 400);
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.05; u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// ── Voice Input ───────────────────────────────
function toggleVoice() {
  if (isListening) { stopVoice(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("Voice not supported — try Chrome."); return; }
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.onresult = e => {
    document.getElementById("chat-input").value = e.results[0][0].transcript;
    stopVoice();
    sendMessage();
  };
  recognition.onerror = recognition.onend = stopVoice;
  recognition.start();
  isListening = true;
  document.getElementById("mic-btn").classList.add("listening");
  document.getElementById("voice-modal").classList.add("open");
}

function stopVoice() {
  if (recognition) { try { recognition.stop(); } catch(e){} recognition = null; }
  isListening = false;
  const mb = document.getElementById("mic-btn");
  if (mb) mb.classList.remove("listening");
  const vm = document.getElementById("voice-modal");
  if (vm) vm.classList.remove("open");
}

// ── Upgrade Modal ─────────────────────────────
function openUpgradeModal()  { document.getElementById("upgrade-modal").classList.add("open"); }
function closeUpgradeModal() { document.getElementById("upgrade-modal").classList.remove("open"); }
function closeModalOutside(e){ if (e.target === e.currentTarget) closeUpgradeModal(); }

function selectPlan(plan) {
  selectedPlan = plan;
  document.querySelectorAll(".plan-option").forEach(el =>
    el.style.borderColor = el.dataset.plan === plan ? "rgba(79,142,255,0.5)" : ""
  );
}

function activatePlanBtn() {
  activatePlan(selectedPlan, false);
  closeUpgradeModal();
}

function activatePlan(plan, silent) {
  isPro = true;
  selectedPlan = plan;
  const label = plan === "elite" ? "🟣 Elite" : "🔵 Pro";
  const el = document.getElementById("plan-label");
  if (el) el.textContent = label;
  document.getElementById("limit-banner")?.classList.add("hidden");
  document.getElementById("sidebar-upgrade")?.style.setProperty("display","none");
  if (!silent) {
    renderMessage("bot",
      `✅ **${plan === "elite" ? "Creator Elite" : "Creator Pro"}** activated! Unlimited chat, full AI access, all tools unlocked. Let's get to work — what's your niche?`
    );
  }
}

// ── Sidebar (mobile) ──────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ── Input Helpers ─────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function scrollBottom() {
  const a = document.getElementById("chat-area");
  if (a) a.scrollTop = a.scrollHeight;
}

// ── Bind suggestion cards on first load ───────
document.addEventListener("DOMContentLoaded", bindSuggestions);
