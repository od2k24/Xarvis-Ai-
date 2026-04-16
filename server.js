import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* =========================
   GEMINI SETUP
========================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});

/* =========================
   HEALTH CHECK
========================= */
app.get('/', (req, res) => {
    res.json({ status: "Xarvis AI (Gemini) running ✅" });
});

/* =========================
   CHAT ENDPOINT
========================= */
app.post('/api/chat', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }]
            }))
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (err) {
        console.error("Gemini error:", err);
        res.status(500).json({
            error: "Gemini request failed",
            detail: err.message
        });
    }
});

/* =========================
   STREAM ENDPOINT (OPTIONAL SIMPLE VERSION)
========================= */
app.post('/api/chat/stream', async (req, res) => {
    const { message } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const result = await model.generateContentStream(message);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`🚀 Xarvis AI (Gemini) running on http://localhost:${PORT}`);
});
