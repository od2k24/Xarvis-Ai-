/**
 * APP CONFIG & STATE
 */
const state = {
    currentPanel: 'dash-panel',
    isTyping: false
};

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatWindow = document.getElementById('chat-window');
const pageTitle = document.getElementById('current-page-title');

/**
 * PANEL NAVIGATION
 */
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-panel');

        navBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
        pageTitle.innerText = btn.innerText.replace(/[^\w\s]/gi, '').trim();
    });
});

/**
 * CHAT SYSTEM
 * FIX: Removed dead callGroq() function entirely.
 * FIX: Added history array to the fetch body.
 * FIX: Wrapped res.json() in try/catch so a bad backend response doesn't crash.
 */
const chatHistory = [];

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || state.isTyping) return;

    // Add user message to UI and history
    appendMessage('usr', message);
    chatHistory.push({ role: 'user', content: message });
    chatInput.value = '';
    toggleLoading(true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                history: chatHistory.slice(0, -1) // send all previous messages
            })
        });

        // FIX: Parse JSON safely — backend might return HTML on crash
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("Backend returned an invalid response");
        }

        if (!response.ok) throw new Error(data?.error || "Server error");

        appendMessage('ai', data.reply);
        chatHistory.push({ role: 'assistant', content: data.reply });

    } catch (err) {
        appendMessage('ai', "⚠️ Error: " + err.message);
    } finally {
        toggleLoading(false);
    }
}

function appendMessage(role, text) {
    const emptyState = chatWindow.querySelector('.chat-empty');
    if (emptyState) emptyState.remove();

    const msgRow = document.createElement('div');
    msgRow.className = `msg-row ${role === 'usr' ? 'user' : ''}`;

    msgRow.innerHTML = `
        <div class="msg-av ${role === 'usr' ? 'usr' : 'ai'}">${role === 'usr' ? 'U' : 'X'}</div>
        <div class="msg-bubble ${role === 'usr' ? 'usr' : 'ai'}">${text}</div>
    `;

    chatWindow.appendChild(msgRow);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function toggleLoading(isLoading) {
    state.isTyping = isLoading;
    sendBtn.disabled = isLoading;

    if (isLoading) {
        const loader = document.createElement('div');
        // FIX: Removed broken [loader.id] bracket syntax
        loader.id = 'typing-indicator';
        loader.className = 'typing-row';
        loader.innerHTML = `<div class="typing-bubble"><span></span><span></span><span></span></div>`;
        chatWindow.appendChild(loader);
    } else {
        const loader = document.getElementById('typing-indicator');
        if (loader) loader.remove();
    }
}

/**
 * EVENT LISTENERS
 */
chatInput.addEventListener('input', () => {
    sendBtn.disabled = !chatInput.value.trim();
    // FIX: Removed broken [chatInput.style] bracket syntax
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);
