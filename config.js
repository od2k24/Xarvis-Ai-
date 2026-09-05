// frontend/js/config.js

const PROD_BACKEND = "https://xarvis-ai.onrender.com";
const DEV_BACKEND = "http://localhost:3001";

const isLocalhost =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

// Export this because app.js imports API_BASE directly.
export const API_BASE = isLocalhost ? DEV_BACKEND : PROD_BACKEND;

export const CONFIG = {
  API_BASE,

  ROUTES: {
    HEALTH: "/api/health",
    CHAT: "/api/chat",
    STREAM: "/api/chat/stream",
    GENERATE: "/api/generate",
  },

  REQUEST_TIMEOUT: 35000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1500,
  MAX_HISTORY: 10,

  DEBUG: true,
};
