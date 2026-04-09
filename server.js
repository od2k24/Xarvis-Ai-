import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq();

app.get('/', (req, res) => {
  res.json({ status: 'Xarvis AI backend is running ✅' });
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [], systemPrompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are Xarvis, an elite AI co-founder and personal intelligence system. Be sharp, direct, and powerful.'
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

app.post('/api/chat/stream', async (req, res) => {
  const { message, history = [], systemPrompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are Xarvis, an elite AI co-founder and personal intelligence system. Be sharp, direct, and powerful.'
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

app.listen(PORT, () => {
  console.log(`✅ Xarvis AI backend running on http://localhost:${PORT}`);
});
