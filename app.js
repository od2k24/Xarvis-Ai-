const API_URL = "http://localhost:3001/api/chat";

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const btnLabel = document.getElementById("btnLabel");
const responseArea = document.getElementById("responseArea");
const scoreBar = document.getElementById("scoreBar");
const scoreValue = document.getElementById("scoreValue");
const scoreFill = document.getElementById("scoreFill");
const charCount = document.getElementById("charCount");

// Char counter
userInput.addEventListener("input", () => {
  const len = userInput.value.length;
  charCount.textContent = `${len} / 2000`;
});

// Enter = submit (shift+enter = newline)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function fillExample(el) {
  userInput.value = el.textContent;
  charCount.textContent = `${el.textContent.length} / 2000`;
  userInput.focus();
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  btnLabel.textContent = loading ? "Analyzing..." : "Analyze with Xarvis";
}

function getScoreColor(score) {
  if (score >= 75) return "#4dff91";
  if (score >= 50) return "#e8ff47";
  if (score >= 30) return "#ffa040";
  return "#ff4757";
}

function renderScore(score) {
  scoreBar.classList.add("visible");
  scoreValue.textContent = score;
  scoreValue.style.color = getScoreColor(score);

  // Animate fill after a tick
  setTimeout(() => {
    scoreFill.style.width = `${score}%`;
  }, 50);
}

function formatResponse(text) {
  // Wrap emoji-led lines for styling
  const lines = text.split("\n");
  const formatted = lines.map(line => {
    const trimmed = line.trim();
    if (/^[⚡🎯💡🔥✦#]/.test(trimmed)) {
      return `<span class="emoji-line">${escapeHtml(line)}</span>`;
    }
    return escapeHtml(line);
  });
  return formatted.join("\n");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  setLoading(true);

  // Show loader
  responseArea.innerHTML = `
    <div class="loader">
      <div class="loader-dots">
        <span></span><span></span><span></span>
      </div>
      Xarvis is thinking...
    </div>
  `;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed.");
    }

    // Render score
    renderScore(data.viralScore);

    // Render response
    responseArea.innerHTML = `<div class="response-content">${formatResponse(data.reply)}</div>`;

  } catch (err) {
    responseArea.innerHTML = `
      <div class="error-msg">
        ⚠ ${err.message}
      </div>
    `;
  } finally {
    setLoading(false);
  }
}
