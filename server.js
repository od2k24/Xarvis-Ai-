console.log("🔥 STARTING XARVIS...");

require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

console.log("PORT =", PORT);

/**
 * HEALTH ONLY (NO GEMINI, NO CORS, NOTHING)
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

/**
 * TEST ROUTE
 */
app.get("/", (req, res) => {
  res.send("Xarvis is alive");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 LISTENING ON", PORT);
});
