'use strict';

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const Groq       = require('groq-sdk');

const chatRoute     = require('./routes/chat');
const generateRoute = require('./routes/generate');
const memoryRoute   = require('./routes/memory');
const agentRoute    = require('./routes/agent');

const app  = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── make groq available to routes ── */
app.set('groq', groq);

/* ── security + parsing ── */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'https://od2k24.github.io'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50kb' }));

/* ── rate limiting ── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down!' },
});
app.use('/api/', limiter);

/* ── health ── */
app.get('/api/health', (req, res) => {
  res.json({
    status:        'running',
    nodeVersion:   process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    nativeFetch:   true,
    version:       '4.0.0',
    agents:        ['strategist', 'researcher', 'creator', 'executor'],
    features:      ['streaming', 'memory', 'multi-agent', 'content-generation'],
  });
});

/* ── routes ── */
app.use('/api', chatRoute);
app.use('/api', generateRoute);
app.use('/api', memoryRoute);
app.use('/api', agentRoute);

/* ── 404 catch-all ── */
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

/* ── global error handler ── */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Xarvis v4 running on :${PORT}`));
