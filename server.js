// server.js — place this BEFORE all route definitions

const cors = require('cors');

const ALLOWED_ORIGINS = new Set([
  'https://od2k24.github.io',
  'http://localhost:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
]);

const corsOptions = {
  origin(origin, callback) {
    // No origin = curl / Postman / same-origin health checks — allow
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  optionsSuccessStatus: 200, // IE11 treats 204 as an error
};

// Apply to all routes
app.use(cors(corsOptions));

// Explicit OPTIONS handler — required for Railway's proxy layer
// which sometimes strips middleware-handled preflight responses
app.options('*', cors(corsOptions));
