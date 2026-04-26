// Xarvis AI V3 — app.js
// Phase 1: Chat system with streaming + goal memory

import { CONFIG } from './config.js';

// ── State ───────────────────────────────────────────────
let userGoal   = '';
let messages   = []; // { role: 'user'|'assistant', content: string }
let isStreaming = false;

// ── DOM Refs ─────────────────────────────────────────────
const chatInner    = document.getElementById('chat-inner');
const emptyState   = document.getElementById('empty-state');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('send-btn');
const chatContainer= document.getElementById('chat-container');
const goalBadgeText= document.getElementById('goal-badge-text');
const statusDot    = document.getElementById('status-dot');
const statusText   = document.getElementById('status-text');
const modalOverlay = document.getElementById('modal-overlay');
const modalGoalInput = document.getElementById('modal-goal-input');

// ── Starter Prompts ──────────────────────────────────────
const STARTERS = [
  'Build me a 30-day action plan for my goal',
  'What should I do today to move forward?',
  'Give me 10 YouTube video ideas for my niche',
  'How do I monetize faster this month?',
  'What are the biggest mistakes to avoid?',
];

// ── Init ─────────────────────────────────────────────────
function init() {
  userGoal = localStorage.getItem(CONFIG.GOAL_STORAGE_KEY) || '';

  // Redirect to index if no goal set
  if (!userGoal) {
    window.location.href = 'index.html';
    return;
  }

  // Load saved chat history
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

// ── Goal Badge ───────────────────────────────────────────
function renderGoalBadge() {
  goalBadgeText.textContent = userGoal;
}

// ── Starters ─────────────────────────────────────────────
function renderStarters() {
  const container = document.getElementById('starters');
  container.innerHTML = '';
  STARTERS.forEach(text => {
    const btn = document.createElement('button');
    btn.className = 'starter-btn';
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

// ── Render All Messages ──────────────────────────────────
function renderAllMessages() {
  // Remove existing message elements (keep empty state)
  chatInner.querySelectorAll('.message').forEach(el => el.remove());

  if (messages.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  messages.forEach(msg => {
    appendMessageEl(msg.role, msg.content);
  });

  scrollToBottom();
}

// ── Create Message Element ───────────────────────────────
function appendMessageEl(role, content = '') {
  emptyState.style.display = 'none';

  const msgEl = document.createElement('div');
  msgEl.className = `message ${role}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'msg-avatar';
  avatarEl.textContent = role === 'user' ? 'U' : 'X';

  const bodyEl = document.createElement('div');
  bodyEl.className = 'msg-body';

  const roleEl = document.createElement('div');
  roleEl.className = 'msg-role';
  roleEl.textContent = role === 'user' ? 'You' : 'Xarvis';

  const contentEl = document.createElement('div');
  contentEl.className = 'msg-content';
  contentEl.textContent = content;

  bodyEl.appendChild(roleEl);
  bodyEl.appendChild(contentEl);
  msgEl.appendChild(avatarEl);
  msgEl.appendChild(bodyEl);
  chatInner.appendChild(msgEl);

  return { msgEl, contentEl };
}

// ── Scroll to Bottom ─────────────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// ── Set Status ───────────────────────────────────────────
function setStatus(text, thinking = false) {
  statusText.textContent = text;
  statusDot.className = `status-dot${thinking ? ' thinking' : ''}`;
}

// ── Send Message ─────────────────────────────────────────
async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content || isStreaming) return;

  isStreaming = true;
  chatInput.value = '';
  adjustTextareaHeight();
  sendBtn.disabled = true;
  setStatus('Thinking...', true);

  // Add user message
  messages.push({ role: 'user', content });
  persistHistory();
  appendMessageEl('user', content);
  scrollToBottom();

  // Prepare AI message element
  const { contentEl } = appendMessageEl('assistant', '');
  // Add blinking cursor
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  contentEl.appendChild(cursor);
  scrollToBottom();

  let fullResponse = '';

  try {
    // Build message array for API (limit history length)
    const historyForAPI = messages
      .slice(-CONFIG.MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: historyForAPI,
        goal: userGoal,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    // Stream SSE response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    setStatus('Streaming...', true);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            // Update text without cursor, then re-add cursor
            contentEl.textContent = fullResponse;
            contentEl.appendChild(cursor);
            scrollToBottom();
          }
        } catch {
          // malformed chunk — skip
        }
      }
    }

  } catch (err) {
    fullResponse = `Error: ${err.message}. Check your API key and try again.`;
    contentEl.textContent = fullResponse;
  } finally {
    // Remove cursor
    cursor.remove();
    contentEl.textContent = fullResponse;

    // Save assistant message
    if (fullResponse) {
      messages.push({ role: 'assistant', content: fullResponse });
      persistHistory();
    }

    isStreaming = false;
    sendBtn.disabled = chatInput.value.trim() === '';
    setStatus('Ready', false);
    scrollToBottom();
  }
}

// ── Persist History ──────────────────────────────────────
function persistHistory() {
  try {
    // Keep only last N messages to avoid localStorage bloat
    const trimmed = messages.slice(-CONFIG.MAX_HISTORY_MESSAGES);
    localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — clear old history
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
  }
}

// ── Textarea Auto-resize ─────────────────────────────────
function adjustTextareaHeight() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
}

// ── Modal ─────────────────────────────────────────────────
function openGoalModal() {
  modalGoalInput.value = userGoal;
  modalOverlay.classList.remove('hidden');
  modalGoalInput.focus();
}

function closeGoalModal() {
  modalOverlay.classList.add('hidden');
}

function saveGoal() {
  const newGoal = modalGoalInput.value.trim();
  if (!newGoal) return;

  const goalChanged = newGoal !== userGoal;
  userGoal = newGoal;
  localStorage.setItem(CONFIG.GOAL_STORAGE_KEY, userGoal);

  // If goal changed, clear chat history for fresh context
  if (goalChanged) {
    messages = [];
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    renderAllMessages();
  }

  renderGoalBadge();
  closeGoalModal();
}

// ── Setup Listeners ──────────────────────────────────────
function setupListeners() {
  // Send on button click
  sendBtn.addEventListener('click', sendMessage);

  // Enable/disable send button
  chatInput.addEventListener('input', () => {
    sendBtn.disabled = chatInput.value.trim() === '' || isStreaming;
    adjustTextareaHeight();
  });

  // Send on Enter, new line on Shift+Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  // Clear conversation
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (messages.length === 0) return;
    if (!confirm('Clear conversation? Your goal will be kept.')) return;
    messages = [];
    localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
    renderAllMessages();
  });

  // Goal modal
  document.getElementById('goal-btn').addEventListener('click', openGoalModal);
  document.getElementById('modal-cancel').addEventListener('click', closeGoalModal);
  document.getElementById('modal-save').addEventListener('click', saveGoal);
  modalGoalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveGoal();
    if (e.key === 'Escape') closeGoalModal();
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeGoalModal();
  });
}

// ── Run ───────────────────────────────────────────────────
init();
