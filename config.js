/**
 * XARVIS AI — FRONTEND CONFIG
 * All tunables in one place. Change API_BASE here if backend URL changes.
 */

// ✅ Your Render backend URL — no trailing slash
const BACKEND_URL = "https://xarvis-ai.onrender.com";

export const CONFIG = {
  API_BASE: BACKEND_URL,

  // How long to wait before aborting a request (ms)
  // Render free tier cold starts can take 15-30s
  REQUEST_TIMEOUT: 35_000,

  // Retry attempts on transient network errors (not 4xx/5xx)
  RETRY_ATTEMPTS: 2,

  // Delay between retries (ms)
  RETRY_DELAY: 1_500,

  // How many chat history turns to send to the backend
  MAX_HISTORY: 10,
};
