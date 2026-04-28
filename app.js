// Xarvis AI V3 — app.js
// Fixed: replaced SSE streaming with plain JSON fetch (matches Railway backend)

import { CONFIG } from './config.js';

// ── State ────────────────────────────────────────────────────────────────────
let userGoal    = '';
let messages    = []; // { role: 'user'|'assistant', content: string }
let isStreaming  = false;

// ── DOM Refs ─────────────────────────────────────────────────────────────────
const chatInner      = document.getElementById('chat-inner');
const emptyState     = document.getElementById('empty-state');
const chatInput      = document.getElementById('chat-input');
const sendBtn        = document.getElementById('send-btn');
const chatContainer  = document.getElementById('chat-container');
const goalBadgeText  = document.getElementById('goal-badge-text');
const statusDot      = document.getElementById('status-dot');
const statusText     = document.getElementById('status-text');
const modalOverlay   = document.getElementById('modal-overlay');
const modalGoalInput = document.getElementById('modal-goal-input');

// ── Starter Prompts ───────────────────────────────────────────────────────────
const STARTERS = [
  'Build me a 30-day action plan for my goal',
  'What should I do today to move forward?',
  'Give me 10 YouTube video ideas for my niche',
  'How do I monetize faster this month?',
  'What are the biggest mistakes to avoid?',
];

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  userGoal = localStorage.getItem(CONFIG.GOAL_STORAGE_KEY) || '';

  if (!userGoal) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const saved = localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY);
    messages = saved ? JSON.parse(saved) : [];
  } catch {
    messages = [];
  }

  renderGoalBadge();
  renderStarters();
  renderAllMessages();
  setupListeners();
  adjustTextareaHeight();
}

// ── Goal Badge ────────────────────────────────────────────────────────────────
function renderGoalBadge() {
  if (goalBadgeText) goalBadgeText.textContent = userGoal;
}

// ── Starters ──────────────────────────────────────────────────────────────────
function renderStarters() {
  const container = document.getElementById('starters');
  if (!container) return;
  container.innerHTML = '';
  STARTERS.forEach(text => {
    const btn = document.createElement('button');
    btn.className   = 'starter-btn';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      chatInput.value = text;
      adjustTextareaHeight();
      sendBtn.disabled = false;
      sendMessage();
    });
    container.appendChild(btn);
  });
}

// ── Render All Messages ───────────────────────────────────────────────────────
function renderAllMessages() {
  chatInner.querySelectorAll('.message').forEach(el => el.remove());

  if (messages.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  messages.forEach(msg => appendMessageEl(msg.role, msg.content));
  scrollToBottom();
}

// ── Create Message Element ────────────────────────────────────────────────────
function appendMessageEl(role, content = '') {
  emptyState.style.display = 'none';

  const msgEl     = document.createElement('div');
  msgEl.className = `message ${role}`;

  const avatarEl      = document.createElement('div');
  avatarEl.className  = 'msg-avatar';
  avatarEl.textContent = role === 'user' ? 'U' : 'X';

  const bodyEl    = document.createElement('div');
  bodyEl.className = 'msg-body';

  const roleEl      = document.createElement('div');
  roleEl.className  = 'msg-role';
  roleEl.textContent = role === 'user' ? 'You' : 'Xarvis';

  const contentEl      = document.createElement('div');
  contentEl.className  = 'msg-content';
  contentEl.textContent = content;

  bodyEl.appendChild(roleEl);
  bodyEl.appendChild(contentEl);
  msgEl.appendChild(avatarEl);
  msgEl.appendChild(bodyEl);
  chatInner.appendChild(msgEl);

  return { msgEl, contentEl };
}

// ── Scroll to Bottom ──────────────────────────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// ── Set Status ────────────────────────────────────────────────────────────────
function setStatus(text, thinking = false) {
  if (statusText) statusText.textContent = text;
  if (statusDot)  statusDot.className = `status-dot${thinking ? ' thinking' : ''}`;
}

// ── FIX: Plain JSON fetch — replaces broken SSE streaming ────────────────────
async function callAPI(messages_payload) {
  const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      messages: messages_payload,
      goal:     userGoal,
    }),
  });

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      // response wasn't JSON — use status code message
    }
    throw new Error(errMsg);
  }

  // FIX: Railway returns plain JSON, not an SSE stream
  // Accepts any of these shapes: { reply }, { text }, { content }, or { choices[0].message.content }
  const data = await response.json();
  const reply =
    data.reply   ??
    data.text    ??
    data.content ??
    data.choices?.[0]?.message?.content ??
    '';

  if (!reply) throw new Error('Empty response from server');
  return reply;
}

// ── Send Message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content || isStreaming) return;

  isStreaming = true;
  chatInput.value = '';
  adjustTextareaHeight();
  sendBtn.disabled = true;
  setStatus('Thinking...', true);

  // Add user message to UI + history
  messages.push({ role: 'user', content });
  persistHistory();
  appendMessageEl('user', content);
  scrollToBottom();

  // Show typing indicator
  const { contentEl } = appendMessageEl('assistant', '');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  contentEl.appendChild(cursor);
  scrollToBottom();

  let fullResponse = '';

  try {
    const historyForAPI = messages
      .slice(-CONFIG.MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content }));

    setStatus('Waiting for Xarvis...', true);

    // FIX: single await — no streaming reader needed
    fullResponse = await callAPI(historyForAPI);

    contentEl.textContent = fullResponse;

  } catch (err) {
    fullResponse = `⚠️ ${err.message}. Check your Railway deployment and try again.`;
    contentEl.textContent = fullResponse;
    console.error('[Xarvis] API error:', err);
  } finally {
    cursor.remove();
    contentEl.textContent = fullResponse;

    if (fullResponse && !fullResponse.startsWith('⚠️')) {
      messages.push({ role: 'assistant', content: fullResponse });
      persistHistory();
    }

    isStreaming      = false;
    sendBtn.disabled = chatInput.value.trim() === '';
    setStatus('Ready', false);
    scrollToBottom();
  }
}

// ── Persist History ───────────────────────────────────────────────────────────
function persistHistory() {
  try {
    const trimmed = messages.slice(-CONFIG.MAX_HISTORY_MESSAGES);
    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
  }
}

// ── Textarea Auto-resize ──────────────────────────────────────────────────────
function adjustTextareaHeight() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openGoalModal() {
  if (modalGoalInput) modalGoalInput.value = userGoal;
  modalOverlay?.classList.remove('hidden');
  modalGoalInput?.focus();
}

function closeGoalModal() {
  modalOverlay?.classList.add('hidden');
}

function saveGoal() {
  const newGoal = modalGoalInput?.value.trim();
  if (!newGoal) return;

  const goalChanged = newGoal !== userGoal;
  userGoal = newGoal;
  localStorage.setItem(CONFIG.GOAL_STORAGE_KEY, userGoal);

  if (goalChanged) {
    messages = [];
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    renderAllMessages();
  }

  renderGoalBadge();
  closeGoalModal();
}

// ── Setup Listeners ───────────────────────────────────────────────────────────
function setupListeners() {
  sendBtn?.addEventListener('click', sendMessage);

  chatInput?.addEventListener('input', () => {
    sendBtn.disabled = chatInput.value.trim() === '' || isStreaming;
    adjustTextareaHeight();
  });

  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  document.getElementById('clear-btn')?.addEventListener('click', () => {
    if (messages.length === 0) return;
    if (!confirm('Clear conversation? Your goal will be kept.')) return;
    messages = [];
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    renderAllMessages();
  });

  document.getElementById('goal-btn')?.addEventListener('click', openGoalModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeGoalModal);
  document.getElementById('modal-save')?.addEventListener('click', saveGoal);

  modalGoalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveGoal();
    if (e.key === 'Escape') closeGoalModal();
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeGoalModal();
  });
}

// ── Run ───────────────────────────────────────────────────────────────────────
init();
