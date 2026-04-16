import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- GROQ CLIENT --------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// -------------------- HEALTH CHECK --------------------
app.get('/', (req, res) => {
  res.json({
    status: 'Xarvis AI backend running ✅',
    time: new Date().toISOString()
  });
});

// -------------------- VIRAL SCORING (OPTIONAL LOGIC LAYER) --------------------
function viralScore(text) {
  let score = 50;
  const t = text.toLowerCase();

  if (t.includes("how to")) score += 10;
  if (t.includes("money") || t.includes("rich")) score += 10;
  if (t.includes("secret")) score += 10;
  if (t.includes("nobody")) score += 10;
  if (t.includes("build")) score += 5;
  if (t.length < 20) score -= 10;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}

// -------------------- CHAT + SCORE ENDPOINT --------------------
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    // AI response
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are Xarvis AI, an elite creator co-founder. Be sharp, practical, and high value.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 800,
    });

    const reply =
      completion.choices?.[0]?.message?.content || 'No response';

    // Optional: viral score based on input
    const score = viralScore(message);

    res.json({
      reply,
      viralScore: score,
      verdict:
        score > 80
          ? 'VIRAL 🔥'
          : score > 60
          ? 'GOOD ⚡'
          : score > 40
          ? 'MID ⚠️'
          : 'LOW ❌'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'AI request failed',
      detail: err.message
    });
  }
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`🚀 Xarvis AI running on http://localhost:${PORT}`);
});
