require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------- MIDDLEWARE --------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

// -------------------- HEALTH --------------------
app.get('/', (req, res) => {
  res.json({ status: 'Xarvis Running 🚀' });
});

// -------------------- AUTH --------------------
const API_KEY = process.env.XARVIS_API_KEY || 'dev-key';

function requireAuth(req, res, next) {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// -------------------- CHAT --------------------
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message' });
    }

    const reply = `
Xarvis Response:
You said: ${message}

Steps:
1. Focus on clarity
2. Build content
3. Stay consistent
`;

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log(`Xarvis running on port ${PORT}`);
});
