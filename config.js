// Xarvis AI V3 — config.js

const isProduction =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

export const CONFIG = {
  API_BASE_URL: isProduction
    ? "https://xarvis-ai.up.railway.app/api"
    : "http://localhost:3001/api",

  APP_NAME: "Xarvis AI",
  VERSION: "3.0.0-phase1",
  GOAL_STORAGE_KEY: "xarvis_user_goal",
  HISTORY_STORAGE_KEY: "xarvis_chat_history",
  MAX_HISTORY_MESSAGES: 20,
};
