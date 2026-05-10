import { CONFIG } from "./config.js";
import { sendChat, streamChat } from "./chat.js";
import { generateViral, generatePostNext, generateCalendar, analyzeFeedback } from "./generate.js";
import { runAgent } from "./agents.js";

// ─── STATE ────────────────────────────────────────────────────
let activePanel = "chat";
let chatHistory = [];
let memory = { niche: "", platform: "YouTube Shorts", goal: "", tone: "Motivational" };

// Load memory from sessionStorage
try {
  const saved = sessionStorage.getItem("xarvis_memory");
  if (saved) memory = { ...memory, ...JSON.parse(saved) };
} catch {}

// ─── HELPERS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = t => String(t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/^#{1,3}\s+(.+)$/gm, '<strong class="ai-heading">$1</strong>')
  .replace(/\n/g, "<br>");

const ex = (txt, label, next) => {
  const m = (txt || "").match(new RegExp(label + ":[\\s\\n]*([\\s\\S]*?)(?=(?:" + next + "):|$)", "i"));
  return m ? m[1].trim() : "";
};

// ─── PANEL SWITCHER ───────────────────────────────────────────
function switchPanel(id) {
  activePanel = id;
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.panel === id));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + id));
  if (id === "chat" && chatHistory.length === 0) renderChatEmpty();
}

// ─── CHAT PANEL ───────────────────────────────────────────────
function renderChatEmpty() {
  const feed = $("chat-feed");
  feed.innerHTML = `
    <div class="chat-empty">
      <div class="logo-badge">X</div>
      <h2>Your AI Advisor is Ready.</h2>
      <p>Ask anything about growing your channel, viral hooks, content strategy, or monetization.</p>
      <div class="sugs-grid">
        ${[
          ["🪝","Viral Hooks","Write me 5 scroll-stopping viral hooks for YouTube Shorts. Make them shocking, curiosity-driven, and bold."],
          ["📈","Growth Plan","Give me a specific 90-day plan to hit 100k subscribers from scratch. Break it down week by week."],
          ["🔮","Trend Intel","What content formats are going viral on YouTube Shorts right now? Give me the top 5 with angles I can use today."],
          ["💰","First $1k","How do I make my first $1,000 as a creator with under 5,000 followers? Give me 3 concrete income streams."],
        ].map(([ic, t, p]) => `<button class="sug-card" onclick="chatSend(${JSON.stringify(p)})"><span class="sug-icon">${ic}</span><strong>${t}</strong></button>`).join("")}
      </div>
    </div>`;
}

function appendMsg(role, html, streaming = false) {
  const feed = $("chat-feed");
  const empty = feed.querySelector(".chat-empty");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.className = `msg msg-${role}${streaming ? " streaming" : ""}`;
  div.innerHTML = `
    <div class="msg-av">${role === "user" ? "U" : "X"}</div>
    <div class="msg-body">${html}</div>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

window.chatSend = async function(prefill) {
  const inp = $("chat-input");
  const txt = prefill || inp.value.trim();
  if (!txt) return;
  inp.value = "";
  inp.style.height = "auto";

  chatHistory.push({ role: "user", content: txt });
  appendMsg("user", txt.replace(/</g, "&lt;"));

  const thinkEl = appendMsg("assistant", `<span class="thinking">Thinking<span class="dots">...</span></span>`, true);

  try {
    let full = "";
    const history = chatHistory.slice(-CONFIG.MAX_HISTORY).map(m => ({ role: m.role, content: m.content }));

    try {
      full = await streamChat(txt, history.slice(0, -1), (partial) => {
        thinkEl.querySelector(".msg-body").innerHTML = fmt(partial) + '<span class="cursor">▋</span>';
        $("chat-feed").scrollTop = $("chat-feed").scrollHeight;
      });
    } catch {
      full = await sendChat(txt, history.slice(0, -1));
    }

    thinkEl.querySelector(".msg-body").innerHTML = fmt(full);
    thinkEl.classList.remove("streaming");
    chatHistory.push({ role: "assistant", content: full });
  } catch (err) {
    thinkEl.querySelector(".msg-body").innerHTML = `<span class="err">⚠️ ${err.message}</span>`;
    thinkEl.classList.remove("streaming");
  }
};

// ─── VIRAL STUDIO ─────────────────────────────────────────────
window.runViral = async function() {
  const topic = $("viral-topic").value.trim();
  const platform = $("viral-platform").value;
  if (!topic) return;

  const out = $("viral-output");
  out.innerHTML = `<div class="loading-pulse"><div></div><div></div><div></div><div></div></div>`;
  $("viral-btn").disabled = true;

  try {
    const res = await generateViral(topic, platform, memory);
    const hook = ex(res, "HOOK", "SCRIPT");
    const script = ex(res, "SCRIPT", "TITLE");
    const titles = ex(res, "TITLE", "THUMBNAIL");
    const thumb = ex(res, "THUMBNAIL", "END");

    out.innerHTML = `
      <div class="out-grid">
        ${outCard("🪝 Hook", hook)}
        ${outCard("✏️ Titles", titles)}
        ${outCard("📝 Script", script, true)}
        ${outCard("🖼 Thumbnail", thumb, true)}
      </div>`;
  } catch (err) {
    out.innerHTML = `<div class="err-box">⚠️ ${err.message}</div>`;
  }
  $("viral-btn").disabled = false;
};

function outCard(label, content, wide = false) {
  const id = "oc-" + Math.random().toString(36).slice(2);
  return `<div class="out-card${wide ? " wide" : ""}">
    <div class="out-card-hdr">
      <span class="out-label">${label}</span>
      <button class="copy-btn" onclick="copyText('${id}')">📋</button>
    </div>
    <div class="out-content" id="${id}">${content.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>
  </div>`;
}

window.copyText = function(id) {
  const el = document.getElementById(id);
  navigator.clipboard.writeText(el.innerText).catch(() => {});
  const btn = el.closest(".out-card").querySelector(".copy-btn");
  btn.textContent = "✓";
  setTimeout(() => btn.textContent = "📋", 2000);
};

// ─── POST NEXT ────────────────────────────────────────────────
window.runPostNext = async function() {
  const out = $("postnext-output");
  out.innerHTML = `<div class="loading-pulse"><div></div><div></div><div></div><div></div></div>`;
  $("postnext-btn").disabled = true;

  const mem = {
    ...memory,
    niche: $("pn-niche").value || memory.niche || "general",
    goal: $("pn-goal").value || memory.goal
  };

  try {
    const res = await generatePostNext(mem);
    const idea = ex(res, "IDEA", "HOOK");
    const hook = ex(res, "HOOK", "WHY");
    const why = ex(res, "WHY IT WILL WORK", "BEST TIME");
    const when = ex(res, "BEST TIME TO POST", "END");

    out.innerHTML = `
      <div class="result-card">
        <div class="result-hdr">⚡ Today's Highest-Potential Post</div>
        <div class="result-body">
          <div class="result-section"><div class="rs-label">💡 The Idea</div><div class="rs-val">${idea.replace(/\n/g,"<br>")}</div></div>
          <div class="result-section accent"><div class="rs-label">🪝 Your Hook</div><div class="rs-val">${hook.replace(/\n/g,"<br>")}</div></div>
          <div class="result-section"><div class="rs-label">📊 Why It Will Work</div><div class="rs-val">${why.replace(/\n/g,"<br>")}</div></div>
          <div class="result-section"><div class="rs-label">⏰ Best Time to Post</div><div class="rs-val">${when.replace(/\n/g,"<br>")}</div></div>
        </div>
      </div>
      <button class="btn-secondary" onclick="runPostNext()">↻ Give me another idea</button>`;
  } catch (err) {
    out.innerHTML = `<div class="err-box">⚠️ ${err.message}</div>`;
  }
  $("postnext-btn").disabled = false;
};

// ─── CALENDAR ─────────────────────────────────────────────────
window.runCalendar = async function() {
  const out = $("cal-output");
  out.innerHTML = `<div class="loading-pulse"><div></div><div></div><div></div><div></div></div>`;
  $("cal-btn").disabled = true;

  const mem = { ...memory, niche: $("cal-niche").value || memory.niche || "general" };

  try {
    const res = await generateCalendar(mem);
    const days = res.split("\n")
      .filter(l => /^DAY\s*\d/i.test(l.trim()))
      .map((line, i) => {
        const p = line.split("|").map(x => x.trim());
        return { day: `Day ${i + 1}`, topic: p[1] || "", angle: p[2] || "", hook: p[3] || "" };
      })
      .filter(d => d.topic);

    const COLS = ["#6366f1","#a855f7","#06b6d4","#22c55e","#f59e0b","#f97316","#ef4444"];
    out.innerHTML = `<div class="cal-grid">${days.map((d, i) => `
      <div class="cal-card" style="--accent:${COLS[i % COLS.length]}">
        <div class="cal-day">📅 ${d.day}</div>
        <div class="cal-topic">${d.topic}</div>
        <div class="cal-angle">${d.angle}</div>
        <div class="cal-hook">"${d.hook}"</div>
      </div>`).join("")}</div>`;
  } catch (err) {
    out.innerHTML = `<div class="err-box">⚠️ ${err.message}</div>`;
  }
  $("cal-btn").disabled = false;
};

// ─── FEEDBACK ─────────────────────────────────────────────────
window.runFeedback = async function() {
  const content = $("feedback-input").value.trim();
  if (!content) return;

  const out = $("feedback-output");
  out.innerHTML = `<div class="loading-pulse"><div></div><div></div><div></div><div></div></div>`;
  $("feedback-btn").disabled = true;

  try {
    const res = await analyzeFeedback(content, memory);
    const strengths = ex(res, "STRENGTHS", "WEAKNESSES");
    const weaknesses = ex(res, "WEAKNESSES", "IMPROVEMENTS");
    const improvements = ex(res, "IMPROVEMENTS", "VIRAL SCORE");
    const verdict = ex(res, "VERDICT", "END");
    const score = res.match(/VIRAL SCORE:\s*(\d+)/i)?.[1] || "?";

    out.innerHTML = `
      <div class="out-grid">
        <div class="out-card border-green">
          <div class="out-label">✅ Strengths</div>
          <div class="out-content">${strengths.replace(/\n/g,"<br>")}</div>
        </div>
        <div class="out-card border-red">
          <div class="out-label">⚠️ Weaknesses</div>
          <div class="out-content">${weaknesses.replace(/\n/g,"<br>")}</div>
        </div>
        <div class="out-card wide border-blue">
          <div class="out-label">🚀 How to Fix It</div>
          <div class="out-content">${improvements.replace(/\n/g,"<br>")}</div>
        </div>
      </div>
      <div class="score-card">
        <div class="score-num">${score}<span class="score-denom">/10</span></div>
        <div class="score-verdict">${verdict.replace(/\n/g,"<br>")}</div>
      </div>`;
  } catch (err) {
    out.innerHTML = `<div class="err-box">⚠️ ${err.message}</div>`;
  }
  $("feedback-btn").disabled = false;
};

// ─── AGENT MODE ───────────────────────────────────────────────
window.runAgent = async function() {
  const goal = $("agent-goal").value.trim();
  if (!goal) return;

  const out = $("agent-output");
  out.innerHTML = `<div class="agent-stream"><div class="thinking">Building your roadmap<span class="dots">...</span></div></div>`;
  $("agent-btn").disabled = true;

  try {
    let full = "";
    await runAgent(goal, memory, (partial) => {
      out.innerHTML = `<div class="agent-stream">${fmt(partial)}<span class="cursor">▋</span></div>`;
    });
    full = out.querySelector(".agent-stream")?.innerText || "";
    out.querySelector(".cursor")?.remove();
  } catch (err) {
    out.innerHTML = `<div class="err-box">⚠️ ${err.message}</div>`;
  }
  $("agent-btn").disabled = false;
};

// ─── MEMORY ───────────────────────────────────────────────────
window.saveMemory = function() {
  memory = {
    niche: $("mem-niche").value,
    platform: $("mem-platform").value,
    goal: $("mem-goal").value,
    tone: $("mem-tone").value
  };
  try { sessionStorage.setItem("xarvis_memory", JSON.stringify(memory)); } catch {}
  const btn = $("mem-save-btn");
  btn.textContent = "✓ Saved to Xarvis Memory";
  btn.style.background = "#22c55e";
  setTimeout(() => { btn.textContent = "💾 Save My Profile"; btn.style.background = ""; }, 2500);

  // Sync inputs
  const pnNiche = $("pn-niche"); if (pnNiche) pnNiche.value = memory.niche;
  const calNiche = $("cal-niche"); if (calNiche) calNiche.value = memory.niche;
};

// ─── TEXTAREA AUTO-RESIZE ─────────────────────────────────────
function initTextarea(id, sendFn) {
  const el = $(id);
  if (!el) return;
  el.addEventListener("input", () => { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 130) + "px"; });
  el.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFn(); } });
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Nav
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
  });

  // Chat textarea
  initTextarea("chat-input", () => chatSend());
  $("chat-send-btn")?.addEventListener("click", () => chatSend());

  // Pre-fill memory fields
  if (memory.niche) {
    ["mem-niche","pn-niche","cal-niche"].forEach(id => { const el = $(id); if (el) el.value = memory.niche; });
  }
  if (memory.platform) { const el = $("mem-platform"); if (el) el.value = memory.platform; }
  if (memory.goal) { const el = $("mem-goal"); if (el) el.value = memory.goal; }
  if (memory.tone) { const el = $("mem-tone"); if (el) el.value = memory.tone; }

  switchPanel("chat");

  // Wake up Render backend silently
  fetch(`${CONFIG.API_BASE}/api/health`).catch(() => {});
});
