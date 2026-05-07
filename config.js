export const CONFIG = {
  // ─── GROQ BACKEND URL ──────────────────────────────
  // Your deployed backend server URL
  API_BASE_URL: "https://xarvis-ai.onrender.com",

  // ─── AI MODEL ──────────────────────────────────────
  MODEL: "llama-3.1-8b-instant",

  // ─── CHAT SETTINGS ─────────────────────────────────
  MAX_HISTORY: 50,

  // ─── STORAGE KEYS ──────────────────────────────────
  CHAT_STORAGE_KEY: "xarvis_chat_history",
  GOAL_STORAGE_KEY: "xarvis_user_goal",

  // ─── REQUEST SETTINGS ──────────────────────────────
  TEMPERATURE: 0.7,

  // ─── UI SETTINGS ───────────────────────────────────
  APP_NAME: "Xarvis AI",
  WELCOME_MESSAGE:
    "🚀 Xarvis AI online. Ready to help you build, create, and scale.",

  // ─── RETRY SYSTEM ──────────────────────────────────
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000,

  // ─── REQUEST TIMEOUT ───────────────────────────────
  REQUEST_TIMEOUT: 20000
};
