console.log("🔥 1 - FILE STARTED");

require("dotenv").config();
console.log("🔥 2 - dotenv loaded");

const express = require("express");
console.log("🔥 3 - express loaded");

const cors = require("cors");
console.log("🔥 4 - cors loaded");

const { GoogleGenerativeAI } = require("@google/generative-ai");
console.log("🔥 5 - gemini sdk loaded");

const app = express();

app.use(cors());
app.use(express.json());

console.log("🔥 6 - middleware set");

const PORT = process.env.PORT;

console.log("🔥 PORT =", PORT);

if (!PORT) {
  console.error("❌ PORT NOT FOUND — Railway issue");
}

/**
 * HEALTH CHECK
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

/**
 * ROOT TEST
 */
app.get("/", (req, res) => {
  res.send("Xarvis alive");
});

/**
 * CHAT TEST (SAFE MODE — NO GEMINI YET)
 */
app.post("/api/chat", (req, res) => {
  console.log("🔥 REQUEST RECEIVED");

  res.json({
    reply: "Xarvis test response working",
  });
});

/**
 * START SERVER
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 SERVER RUNNING ON", PORT);
});
