const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CHAT ENDPOINT
// ============================================================
app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

  // ---- Claude (Anthropic) ----
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1500,
          system: systemPrompt || getDefaultSystemPrompt(),
          messages: messages,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Anthropic error:', err);
        return res.status(500).json({ error: err.error?.message || 'Anthropic API error' });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'No response generated.';
      return res.json({ reply, provider: 'claude' });
    } catch (err) {
      console.error('Anthropic request failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ---- OpenAI ----
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          messages: [
            { role: 'system', content: systemPrompt || getDefaultSystemPrompt() },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('OpenAI error:', err);
        return res.status(500).json({ error: err.error?.message || 'OpenAI API error' });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'No response generated.';
      return res.json({ reply, provider: 'openai' });
    } catch (err) {
      console.error('OpenAI request failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ---- No API Key — Demo Mode ----
  console.log('⚠️  No API key configured. Running in demo mode.');
  const demoReply = getDemoResponse(messages[messages.length - 1]?.content || '');
  return res.json({ reply: demoReply, provider: 'demo' });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.ANTHROPIC_API_KEY ? 'claude' : process.env.OPENAI_API_KEY ? 'openai' : 'demo',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// SERVE LANDING PAGE
// ============================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// ============================================================
// DEFAULT SYSTEM PROMPT
// ============================================================
function getDefaultSystemPrompt() {
  return `You are Xarvis Creator AI — an elite AI co-founder for content creators.
Your job is NOT to give generic advice. Your job is to help the user grow fast, get results, and make money.

You must always:
1. Be extremely practical and actionable — give step-by-step instructions, no vague advice
2. Focus on outcomes — growth (views, followers), monetization (money, offers, products)
3. Think like a top creator strategist — viral creators, marketing psychology, content systems
4. Structure every response like this:

🔥 **Goal:**
(What the user will achieve)

⚡ **Plan:**
(Simple high-level strategy)

🧠 **Execution Steps:**
(Clear numbered steps they can follow TODAY)

🎯 **Example:**
(Give a real example: script, hook, idea, etc.)

🚀 **Bonus:**
(Extra tactic most people don't know)

5. Be slightly intense and direct — push the user to act, no fluff, no filler
6. Personalize responses — use previous messages (memory), adapt to their niche and goals  
7. Always prioritize speed — what gets results FAST, not theory

Never say "it depends" without giving a clear direction.
Never give generic advice.
Always make the user feel like they have a clear next move.
You are not just an AI. You are their unfair advantage.`;
}

// ============================================================
// DEMO RESPONSES (no API key mode)
// ============================================================
function getDemoResponse(input) {
  const lower = input.toLowerCase();

  if (lower.includes('hook') || lower.includes('youtube') || lower.includes('tiktok')) {
    return `🔥 **Goal:**
Generate 5 viral hooks that stop the scroll and get 1M+ views.

⚡ **Plan:**
Use proven hook formulas that exploit curiosity gaps, controversy, and identity triggers.

🧠 **Execution Steps:**
1. Open TikTok/YouTube and search your niche + "viral"
2. Find the top 3 videos from last 30 days
3. Analyze the first 3 seconds — that's your hook blueprint
4. Use these templates:
   - "Nobody talks about [secret thing]..."
   - "I tried [thing] for 30 days. Here's what happened."
   - "Stop doing [common mistake]. Do this instead."
5. Film 3 versions of your hook — test all 3 in one week

🎯 **Example Hook:**
"The pasta recipe that got me 2.1M views — and it's not what you think. Watch the first 10 seconds."

🚀 **Bonus:**
Add a visual pattern interrupt in the first frame — movement, color change, or text overlay. Algorithms reward immediate engagement. Most creators skip this and wonder why they don't go viral.

⚡ **Act today.** Film your first hook attempt in the next 2 hours. Post it. The only way to find your viral formula is to test fast.`;
  }

  if (lower.includes('monetiz') || lower.includes('money') || lower.includes('income')) {
    return `🔥 **Goal:**
Build 3 income streams from your content in the next 90 days.

⚡ **Plan:**
Stack passive + active income: brand deals → digital products → community.

🧠 **Execution Steps:**
1. **Month 1:** Land your first brand deal
   - DM 20 brands in your niche TODAY
   - Ask for gifted collabs first (builds credibility)
   - Charge $500-2000 per post at 10-50k followers
2. **Month 2:** Launch a digital product
   - Sell a $27 guide or template pack
   - Your most-asked question = your product idea
   - Use Gumroad or Stan.store (takes 10 min to set up)
3. **Month 3:** Build a paid community
   - $9-29/month subscription on Discord or Patreon
   - Give members early access + monthly Q&A
   - 100 members = $1,000-2,900/month recurring

🎯 **Example:**
A cooking creator with 25k followers made $4,200 last month: $1,800 from a brand deal, $1,400 from a $37 recipe eBook, and $1,000 from 50 Patreon members at $19/month.

🚀 **Bonus:**
Don't wait for brand deals to come to you. Use a pitch template that says: "I noticed you don't have a creator partner in [your niche]. My audience buys [their product category] — here's my media kit." Send 20 of these. 3-5 will respond.

You're leaving money on the table every day you wait. Start with step 1 — DM 5 brands right now.`;
  }

  if (lower.includes('growth') || lower.includes('follower') || lower.includes('100k') || lower.includes('viral')) {
    return `🔥 **Goal:**
Hit 100K followers in 90 days using a systematic posting strategy.

⚡ **Plan:**
3 videos/day → analyze what works → double down → repeat.

🧠 **Execution Steps:**
1. **Days 1-7:** Post 3x/day — morning, afternoon, evening
   - Film in batches (2 hours = 7 days of content)
   - Use trending audios (check TikTok "Trending" tab daily)
2. **Days 8-14:** Audit your analytics
   - Which video got 2x more views? That's your winning format
   - What time got most engagement? Lock that in
3. **Days 15-30:** Specialize your format
   - Pick the top performing style and go all in
   - Create a recognizable series (e.g., "Day X of...")
4. **Days 31-90:** Collab + Repurpose
   - Duet/stitch 3 creators in your niche per week
   - Repurpose your TikTok to YouTube Shorts and Reels — 3x the reach for free

🎯 **Example:**
A fitness creator went from 8K to 94K in 78 days by posting "30-second gym tip" Reels every day at 7AM EST. Same format, same time, different tip. Algorithmic consistency = algorithmic reward.

🚀 **Bonus:**
The creators who grow fastest post content they can make in under 30 minutes. Stop overthinking production. A phone + good lighting beats a studio with no consistency every single time.

Start today. Film 3 videos right now and schedule them.`;
  }

  // Default
  return `🔥 **Goal:**
Get you clear on your next move as a creator — starting TODAY.

⚡ **Plan:**
Share your niche, platform, and current follower count — I'll build you a specific strategy.

🧠 **Execution Steps:**
1. Tell me: What's your content niche?
2. Tell me: Which platform are you focused on?
3. Tell me: What's your current follower count?
4. Tell me: What's your #1 challenge right now?

Give me these 4 things and I'll give you a custom 90-day growth and monetization plan. Not generic advice — YOUR specific plan.

🎯 **Example questions to ask me:**
- "I'm a fitness creator on TikTok with 12k followers. Help me reach 100k."
- "Write me 5 viral hooks for my cooking channel."
- "How do I make money with 50k YouTube subscribers?"
- "Build me a 30-day content calendar for lifestyle content."

🚀 **Bonus:**
The creators who grow fastest treat their content like a business. They study their analytics weekly, test new formats monthly, and never post without a hook strategy. That's what I'm here to help you build.

**What's your niche?** Let's get to work. 🚀

> ⚙️ *Demo mode — add your API key in .env to unlock full AI-powered responses.*`;
}

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Xarvis AI running at http://localhost:${PORT}`);
  console.log(`📄 Landing page: http://localhost:${PORT}/`);
  console.log(`💬 Chat app:     http://localhost:${PORT}/app.html`);

  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (hasAnthropicKey) {
    console.log(`🤖 AI Provider: Claude (Anthropic)`);
  } else if (hasOpenAIKey) {
    console.log(`🤖 AI Provider: OpenAI GPT-4o-mini`);
  } else {
    console.log(`⚠️  No API key found — running in demo mode`);
    console.log(`   Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env to enable real AI`);
  }
  console.log('');
});
