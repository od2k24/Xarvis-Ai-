/**

* XARVIS AI — PRODUCTION CONFIG
* Centralized frontend configuration
  */

// ─────────────────────────────────────────────
// BACKEND URL
// ─────────────────────────────────────────────

// Production Render backend
const PROD_BACKEND = "https://xarvis-ai.onrender.com";

// Local development backend
const DEV_BACKEND = "http://localhost:3001";

// Auto-detect environment
const isLocalhost =
location.hostname === "localhost" ||
location.hostname === "127.0.0.1";

// Final API base
const API_BASE = isLocalhost
? DEV_BACKEND
: PROD_BACKEND;

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
export const CONFIG = {
// Core
API_BASE,

// Routes
ROUTES: {
HEALTH: "/api/health",
CHAT: "/api/chat",
STREAM: "/api/chat/stream",
GENERATE: "/api/generate",
},

// Request handling
REQUEST_TIMEOUT: 35000,

// Retry logic
RETRY_ATTEMPTS: 2,
RETRY_DELAY: 1500,

// Chat memory
MAX_HISTORY: 10,

// Debug mode
DEBUG: true,
};

// ─────────────────────────────────────────────
// STARTUP VALIDATION
// ─────────────────────────────────────────────
if (!CONFIG.API_BASE) {
throw new Error(
"[Xarvis Config] Missing API_BASE"
);
}

console.log("[Xarvis Config Loaded]", {
API_BASE: CONFIG.API_BASE,
MODE: isLocalhost ? "development" : "production",
});
