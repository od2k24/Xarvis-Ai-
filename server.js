import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://od2k24.github.io', 'http://localhost:3000', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Xarvis AI backend is running' });
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [], systemPrompt } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const contents = [];

    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const defaultPrompt = 'You are Xarvis Creator AI, an elite AI co-founder for content creators. Be direct, actionable, and focused on growth and monetization.';

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt || defaultPrompt }]
          },
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.8 }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      const msg = errData.error ? errData.error.message : 'Gemini error ' + response.status;
      throw new Error(msg);
    }

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text || 'No response generated.';
    res.json({ reply });

  } catch (err) {
    console.error('Gemini error:', err.message);

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt || 'You are Xarvis, an elite AI co-founder for creators.' },
            ...history,
            { role: 'user', content: message }
          ],
          max_tokens: 1024
        })
      });

      const groqData = await groqRes.json();
      const reply = groqData.choices[0].message.content || 'No response';
      res.json({ reply });

    } catch (fallbackErr) {
      console.error('Fallback error:', fallbackErr.message);
      res.status(500).json({ error: 'AI request failed', detail: err.message });
    }
  }
});

app.listen(PORT, () => console.log('Xarvis AI backend running on port ' + PORT));
