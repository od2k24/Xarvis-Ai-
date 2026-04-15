require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------- CORS ----------------
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// ---------------- HEALTH ----------------
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis Stable Running 🚀' });
});

// ---------------- AUTH ----------------
const API_KEY = process.env.XARVIS_API_KEY || 'dev-key';

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---------------- SIMPLE MEMORY ----------------
const memory = new Map();

// ---------------- CHAT ----------------
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message' });
    }

    const ip = req.ip;

    if (!memory.has(ip)) {
      memory.set(ip, { messages: [] });
    }

    const user = memory.get(ip);
    user.messages.push(message);
    user.messages = user.messages.slice(-10);

    const reply = `
🔥 Xarvis Response

You said: ${message}

🧠 Step 1: Focus on clarity  
⚡ Step 2: Execute daily  
🚀 Step 3: Stay consistent  
`;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- START ----------------
app.listen(PORT, () => {
  console.log(`🚀 Xarvis running on port ${PORT}`);
});
