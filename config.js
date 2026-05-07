export const CONFIG = {
  // ─── CLOUDFLARE WORKER URL ─────────────────────────
  // Replace this with YOUR actual deployed worker URL
  API_BASE_URL: "https://xarvis.yourname.workers.dev",

  // ─── AI MODEL ──────────────────────────────────────
  MODEL: "claude-3-haiku-20240307",

  // ─── CHAT SETTINGS ─────────────────────────────────
  MAX_HISTORY: 50,

  // ─── STORAGE KEYS ──────────────────────────────────
  CHAT_STORAGE_KEY: "xarvis_chat_history",
  GOAL_STORAGE_KEY: "xarvis_user_goal",

  // ─── REQUEST SETTINGS ──────────────────────────────
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.7,

  // ─── UI SETTINGS ───────────────────────────────────
  APP_NAME: "Xarvis AI",
  WELCOME_MESSAGE:
    "🚀 Xarvis AI online. Ready to help you build, learn, and create.",

  // ─── RETRY SYSTEM ──────────────────────────────────
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000,

  // ─── REQUEST TIMEOUT ───────────────────────────────
  REQUEST_TIMEOUT: 20000
};
