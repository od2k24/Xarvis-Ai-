import 'dotenv/config'; // ✅ Must be FIRST line
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk'; // ✅ Correct import

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Groq client — uses GROQ_API_KEY from .env automatically
const groq = new Groq();

// ✅ Health check — visit http://localhost:3001/ to confirm server is running
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis AI backend is running ✅' });
});

// ✅ Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are Xarvis, an elite AI co-founder and personal intelligence system. Be sharp, direct, and powerful.'
      },
      ...history,
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || 'No response';
    res.json({ reply });

  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ error: 'AI request failed', detail: err.message });
  }
});

// ✅ SSE Streaming endpoint
app.post('/api/chat/stream', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are Xarvis, an elite AI co-founder and personal intelligence system. Be sharp, direct, and powerful.'
      },
      ...history,
      { role: 'user', content: message }
    ];

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Xarvis AI backend running on http://localhost:${PORT}`);
});