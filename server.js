console.log("🔥 NODE STARTED - FILE IS RUNNING");
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

setTimeout(() => {
  console.log("⏱ still alive after 2s");
}, 2000);
dotenv.config();

// ─────────────────────────────
// IMPORTS
// ─────────────────────────────
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

// ─────────────────────────────
// GROQ SETUP
// ─────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Debug: check if key exists
console.log("🔑 GROQ KEY EXISTS:", !!process.env.GROQ_API_KEY);

// ─────────────────────────────
// APP SETUP
// ─────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────
// MIDDLEWARE
// ─────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────
// ROUTES
// ─────────────────────────────

// Root
app.get("/", (req, res) => {
  res.json({
    status: "Xarvis AI API running 🚀",
    time: new Date().toISOString(),
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    node: process.version,
  });
  res.send("Server is running 🚀");
});

// Ping
app.get("/api/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong 🟢",
  });
});

// ─────────────────────────────
// CHAT (FULLY FIXED)
// ─────────────────────────────
app.post("/api/chat", async (req, res) => {
app.post("/chat", async (req, res) => {
  try {
    const { message, messages, history, context } = req.body || {};

    console.log("📨 BODY RECEIVED:", req.body);
    const userMessage = req.body.message;

    const chatHistory = messages || history || [];

    if (!message && chatHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No message provided",
      });
    if (!process.env.API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const formattedMessages = [
      {
        role: "system",
        content: `You are Xarvis AI. Be helpful, smart, and concise. Context: ${context || "none"}`,
      },
      ...chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: message,
    const response = await fetch("YOUR_API_URL_HERE", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
    ];

    let completion;

    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // ✅ safest working model
        messages: formattedMessages,
        temperature: 0.7,
      });
    } catch (groqError) {
      console.error("🔥 FULL GROQ ERROR:", groqError);

      return res.status(500).json({
        success: false,
        error: "Groq request failed",
        details: groqError?.message || groqError,
      });
    }

    const reply = completion?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        success: false,
        error: "Empty AI response",
      });
    }

    return res.json({
      success: true,
      reply,
      body: JSON.stringify({
        message: userMessage
      })
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    const data = await response.json();

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message,
    });
    res.json({ reply: data });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server failed" });
  }
});

// ─────────────────────────────
// 404
// ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});
const PORT = process.env.PORT || 3000;

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
