// frontend/js/app.js

import { API_BASE } from "./config.js";

import {
  sendChat,
  streamChat,
} from "./chat.js";

import {
  generateViral,
  generatePostNext,
  generateCalendar,
  analyzeFeedback,
} from "./generate.js";

import {
  runAgent,
} from "./agents.js";

// ==================================================
// XARVIS APP STATE
// ==================================================

const state = {
  history: [],
  memory: {},
  busy: false,
};

// ==================================================
// DOM HELPERS
// ==================================================

function $(selector) {
  return document.querySelector(selector);
}

function getElement(...selectors) {
  for (const selector of selectors) {
    const element = $(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

function setText(element, text) {
  if (!element) return;

  element.textContent = text ?? "";
}

function setLoading(button, loading, normalText) {
  if (!button) return;

  button.disabled = loading;

  if (loading) {
    button.dataset.originalText =
      button.textContent || normalText || "";
    button.textContent = "Working...";
  } else {
    button.textContent =
      button.dataset.originalText || normalText || "";
  }
}

// ==================================================
// MEMORY
// ==================================================

function loadMemory() {
  try {
    const saved = localStorage.getItem("xarvis_memory");

    if (saved) {
      state.memory = JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Could not load Xarvis memory.");
    state.memory = {};
  }
}

function saveMemory() {
  try {
    localStorage.setItem(
      "xarvis_memory",
      JSON.stringify(state.memory)
    );
  } catch (error) {
    console.warn("Could not save Xarvis memory.");
  }
}

// ==================================================
// CHAT UI
// ==================================================

function addMessage(role, content) {
  const container = getElement(
    "#chatMessages",
    "#messages",
    ".chat-messages"
  );

  if (!container) return null;

  const message = document.createElement("div");

  message.className =
    role === "user"
      ? "message user-message"
      : "message assistant-message";

  message.dataset.role = role;

  const contentElement = document.createElement("div");

  contentElement.className = "message-content";
  contentElement.textContent = content || "";

  message.appendChild(contentElement);
  container.appendChild(message);

  container.scrollTop = container.scrollHeight;

  return contentElement;
}

function updateMessage(element, content) {
  if (!element) return;

  element.textContent = content || "";

  const container = getElement(
    "#chatMessages",
    "#messages",
    ".chat-messages"
  );

  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// ==================================================
// HEALTH CHECK
// ==================================================

async function checkBackend() {
  try {
    const response = await fetch(
      `${API_BASE}/api/health`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    const data = await response.json();

    console.log("Xarvis backend:", data);

    return true;
  } catch (error) {
    console.warn(
      "Xarvis backend health check failed:",
      error.message
    );

    return false;
  }
}

// ==================================================
// CHAT
// ==================================================

async function handleChat(message) {
  if (!message || state.busy) return;

  state.busy = true;

  addMessage("user", message);

  const assistantElement =
    addMessage("assistant", "Thinking...");

  try {
    let fullText = "";

    // ----------------------------------------------
    // TRY STREAMING FIRST
    // ----------------------------------------------

    try {
      fullText = await streamChat(
        message,
        state.history,
        (chunk) => {
          if (!assistantElement) return;

          if (assistantElement.textContent === "Thinking...") {
            assistantElement.textContent = "";
          }

          assistantElement.textContent += chunk;
        }
      );
    } catch (streamError) {
      console.warn(
        "Streaming failed, using normal chat:",
        streamError.message
      );

      // --------------------------------------------
      // FALLBACK TO NORMAL CHAT
      // --------------------------------------------

      const result = await sendChat(
        message,
        state.history
      );

      fullText =
        result?.reply ||
        result?.content ||
        result?.message ||
        "";

      updateMessage(
        assistantElement,
        fullText
      );
    }

    if (!fullText) {
      throw new Error(
        "Xarvis returned an empty response."
      );
    }

    // ----------------------------------------------
    // SAVE HISTORY
    // ----------------------------------------------

    state.history.push({
      role: "user",
      content: message,
    });

    state.history.push({
      role: "assistant",
      content: fullText,
    });

    // Keep history manageable.
    state.history = state.history.slice(-10);

    // Save memory.
    state.memory.lastMessage = message;
    state.memory.lastResponse = fullText;

    saveMemory();

  } catch (error) {
    console.error("Xarvis chat error:", error);

    updateMessage(
      assistantElement,
      "Sorry, I couldn't connect to Xarvis AI right now."
    );
  } finally {
    state.busy = false;
  }
}

// ==================================================
// SEND BUTTON / ENTER
// ==================================================

function setupChat() {
  const input = getElement(
    "#chatInput",
    "#messageInput",
    "textarea"
  );

  const button = getElement(
    "#sendButton",
    "#sendBtn",
    "[data-action='send']"
  );

  if (!input) {
    console.warn("Xarvis chat input not found.");
    return;
  }

  async function submit() {
    const message = input.value.trim();

    if (!message || state.busy) {
      return;
    }

    input.value = "";

    await handleChat(message);
  }

  if (button) {
    button.addEventListener("click", submit);
  }

  input.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submit();
    }
  });
}

// ==================================================
// VIRAL CONTENT
// ==================================================

function setupViral() {
  const button = getElement(
    "#generateViral",
    "#viralButton",
    "[data-action='viral']"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    const topicInput = getElement(
      "#viralTopic",
      "#topicInput"
    );

    const platformInput = getElement(
      "#viralPlatform",
      "#platformInput"
    );

    const output = getElement(
      "#viralOutput",
      "#generateOutput"
    );

    const topic =
      topicInput?.value.trim() || "";

    const platform =
      platformInput?.value.trim() ||
      "General";

    if (!topic) {
      setText(output, "Enter a topic first.");
      return;
    }

    setLoading(button, true);

    try {
      const result = await generateViral(
        topic,
        platform,
        state.memory
      );

      setText(
        output,
        result?.result ||
          result?.content ||
          result?.reply ||
          "No result returned."
      );
    } catch (error) {
      setText(
        output,
        `Error: ${error.message}`
      );
    } finally {
      setLoading(button, false);
    }
  });
}

// ==================================================
// POST NEXT
// ==================================================

function setupPostNext() {
  const button = getElement(
    "#postNext",
    "#postNextButton",
    "[data-action='postnext']"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    const output = getElement(
      "#postNextOutput",
      "#generateOutput"
    );

    setLoading(button, true);

    try {
      const result =
        await generatePostNext(
          state.memory
        );

      setText(
        output,
        result?.result ||
          result?.content ||
          result?.reply ||
          "No recommendation returned."
      );
    } catch (error) {
      setText(
        output,
        `Error: ${error.message}`
      );
    } finally {
      setLoading(button, false);
    }
  });
}

// ==================================================
// CONTENT CALENDAR
// ==================================================

function setupCalendar() {
  const button = getElement(
    "#generateCalendar",
    "#calendarButton",
    "[data-action='calendar']"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    const output = getElement(
      "#calendarOutput",
      "#generateOutput"
    );

    setLoading(button, true);

    try {
      const result =
        await generateCalendar(
          state.memory
        );

      setText(
        output,
        result?.result ||
          result?.content ||
          result?.reply ||
          "No calendar returned."
      );
    } catch (error) {
      setText(
        output,
        `Error: ${error.message}`
      );
    } finally {
      setLoading(button, false);
    }
  });
}

// ==================================================
// FEEDBACK
// ==================================================

function setupFeedback() {
  const button = getElement(
    "#analyzeFeedback",
    "#feedbackButton",
    "[data-action='feedback']"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    const contentInput = getElement(
      "#feedbackContent",
      "#contentInput"
    );

    const output = getElement(
      "#feedbackOutput",
      "#generateOutput"
    );

    const content =
      contentInput?.value.trim() || "";

    if (!content) {
      setText(
        output,
        "Enter some content to analyze first."
      );

      return;
    }

    setLoading(button, true);

    try {
      const result =
        await analyzeFeedback(
          content,
          state.memory
        );

      setText(
        output,
        result?.result ||
          result?.content ||
          result?.reply ||
          "No feedback returned."
      );
    } catch (error) {
      setText(
        output,
        `Error: ${error.message}`
      );
    } finally {
      setLoading(button, false);
    }
  });
}

// ==================================================
// AGENT
// ==================================================

function setupAgent() {
  const button = getElement(
    "#runAgent",
    "#agentButton",
    "[data-action='agent']"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    const goalInput = getElement(
      "#agentGoal",
      "#goalInput"
    );

    const output = getElement(
      "#agentOutput",
      "#generateOutput"
    );

    const goal =
      goalInput?.value.trim() || "";

    if (!goal) {
      setText(
        output,
        "Enter a goal first."
      );

      return;
    }

    setLoading(button, true);

    try {
      const result = await runAgent(
        goal,
        state.memory,
        (chunk) => {
          if (!output) return;

          if (
            output.textContent ===
            "Working..."
          ) {
            output.textContent = "";
          }

          output.textContent += chunk;
        }
      );

      if (result) {
        setText(output, result);
      }
    } catch (error) {
      setText(
        output,
        `Error: ${error.message}`
      );
    } finally {
      setLoading(button, false);
    }
  });
}

// ==================================================
// INITIALISE
// ==================================================

function init() {
  loadMemory();

  setupChat();
  setupViral();
  setupPostNext();
  setupCalendar();
  setupFeedback();
  setupAgent();

  checkBackend();

  console.log("Xarvis AI frontend initialized.");
}

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}

export {
  state,
  handleChat,
  checkBackend,
};
