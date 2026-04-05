require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const XARVIS_SYSTEM_PROMPT = `You are Xarvis — an elite AI co-founder, creative strategist, and personal intelligence system. You are not a generic assistant. You are razor-sharp, direct, visionary, and deeply practical.

Your response format (always use this structure):
🔥 **Goal** — Restate what the user actually wants (sharper than they said it)
⚡ **Plan** — Your strategic take in 1-2 sentences
🧠 **Steps** — Numbered, concrete, actionable steps
🎯 **Example** — A specific real-world example or template
🚀 **Bonus** — One unexpected insight that 10x's their result

Tone: Confident. Direct. No fluff. You are their most capable advisor.
Always close with a power question that pushes the user forward.`;

const DEMO_RESPONSES = [
  `🔥 **Goal** — You want to build something that actually works, fast.\n\n⚡ **Plan** — Stop planning, start shipping. The market will tell you what to refine.\n\n🧠 **Steps**\n1. Define the ONE metric that proves success\n2. Build the smallest version that tests it\n3. Get 10 users within 7 days\n4. Interview them, not survey them\n5. Iterate in 48-hour sprints\n\n🎯 **Example** — Airbnb launched as a single landing page. No booking engine. Just emails.\n\n🚀 **Bonus** — Your first 100 users should feel like they're getting white-glove service.\n\n💡 *What's the one thing you need to validate in the next 7 days?*`,
  `🔥 **Goal** — You want content that actually converts, not just gets likes.\n\n⚡ **Plan** — Virality is a byproduct of specificity. Stop trying to appeal to everyone.\n\n🧠 **Steps**\n1. Pick ONE person you're writing for\n2. Lead with the problem, not the solution\n3. Give the insight in the first 3 lines\n4. End with a statement, not a question\n5. Post at peak hours for your audience\n\n🎯 **Example** — "I grew from 200 to 12,000 followers in 90 days. The only thing I changed: I stopped being nice."\n\n🚀 **Bonus** — Your best content is the thing you're scared to post.\n\n💡 *What's the one take you've been avoiding sharing?*`
];

let demoIndex = 0;

async function getAIResponse(messages, plan) {
  const maxTokens = plan === 'pro' ? 1200 : plan === 'elite' ? 2000 : 600;

  // Try Groq (free)
  if (process.env.GROQ_API_KEY) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: XARVIS_SYSTEM_PROMPT }, ...messages],
        max_tokens: maxTokens,
        temperature: 0.8,
      });
      return { content: completion.choices[0].message.content, provider: 'groq' };
    } catch (err) {
      console.error('Groq error:', err.message);
    }
  }

  // Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: XARVIS_SYSTEM_PROMPT }, ...messages],
        max_tokens: maxTokens,
        temperature: 0.8,
      });
      return { content: completion.choices[0].message.content, provider: 'openai' };
    } catch (err) {
      console.error('OpenAI error:', err.message);
    }
  }

  // Try Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: XARVIS_SYSTEM_PROMPT,
        messages,
      });
      return { content: response.content[0].text, provider: 'anthropic' };
    } catch (err) {
      console.error('Anthropic error:', err.message);
    }
  }

  // Demo fallback
  const response = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length];
  demoIndex++;
  return { content: response, provider: 'demo' };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, plan = 'free' } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });
    const context = { free: 10, pro: 30, elite: 100 };
    const contextMessages = messages.slice(-(context[plan] || 10));
    const result = await getAIResponse(contextMessages, plan);
    res.json({ content: result.content, provider: result.provider, plan });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get response', details: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groq: !!process.env.GROQ_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    mode: (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) ? 'live' : 'demo'
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Xarvis AI running on http://localhost:${PORT}`);
  console.log(`   Groq: ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
  console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'}\n`);
});