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
        
        // Update UI
        navBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
        pageTitle.innerText = btn.innerText.replace(/[^\w\s]/gi, '').trim();
    });
});

/**
 * CHAT SYSTEM
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || state.isTyping) return;

    // 1. Add User Message to UI
    appendMessage('usr', message);
    chatInput.value = '';
    toggleLoading(true);

    try {
        // 2. Call Vercel Backend
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Server error");

        // 3. Add AI Response to UI
        appendMessage('ai', data.reply);
    } catch (err) {
        appendMessage('ai', "⚠️ Error: " + err.message);
    } finally {
        toggleLoading(false);
    }
}

function appendMessage(role, text) {
    // Remove empty state if present
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
