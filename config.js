// Xarvis AI V3 — Config
// Switches API base URL based on environment

const isProduction = window.location.hostname !== "localhost" &&
                     window.location.hostname !== "127.0.0.1";

export const CONFIG = {
  API_BASE_URL: isProduction
    ? "https://xarvis-ai.vercel.app/api"
    : "http://localhost:3000/api",

  APP_NAME: "Xarvis AI",
  VERSION: "3.0.0-phase1",

  // Phase 1: local storage key for user goal
  GOAL_STORAGE_KEY: "xarvis_user_goal",
  HISTORY_STORAGE_KEY: "xarvis_chat_history",

  // Model config (future: move to backend)
  MAX_HISTORY_MESSAGES: 20, // Keep context window manageable

  // Future Phase 2+ — NOT implemented, design only
  // AUTH_ENDPOINT: "/api/auth",
  // BILLING_ENDPOINT: "/api/billing",
  // AGENTS_ENDPOINT: "/api/agents",
};
