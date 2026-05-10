export const CONFIG = {
  // ─── BACKEND ──────────────────────────────────────
  API_BASE: "https://xarvis-ai.onrender.com",

  // ─── AI MODEL (backend-controlled) ────────────────
  MODEL: "llama-3.1-8b-instant",

  // ─── CHAT SETTINGS ─────────────────────────────────
  MAX_HISTORY: 50,

  // ─── STORAGE KEYS ──────────────────────────────────
  CHAT_STORAGE_KEY: "xarvis_chat_history",
  GOAL_STORAGE_KEY: "xarvis_user_goal",

  // ─── REQUEST SETTINGS ──────────────────────────────
  TEMPERATURE: 0.7,
  REQUEST_TIMEOUT: 20000,

  // ─── RETRY SYSTEM ──────────────────────────────────
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000,

  // ─── UI ────────────────────────────────────────────
  APP_NAME: "Xarvis AI",
  WELCOME_MESSAGE:
    "🚀 Xarvis AI online. Ready to help you build, create, and scale."
};
