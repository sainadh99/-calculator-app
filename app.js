require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const port = 80; // Serve on port 80 for direct access via http://IP

// --- Helmet security (relaxed for IP access) ---
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false
}));
app.disable('x-powered-by');

// --- Other security middlewares ---
app.use(express.json({ limit: '10kb' }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// --- Serve frontend static files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Ensure data directory exists ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// --- Initialize SQLite DB ---
const dbPath = path.join(dataDir, 'calc-history.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite DB:', err);
    process.exit(1);
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    num1 REAL NOT NULL,
    num2 REAL NOT NULL,
    result REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- Log requests ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

// --- Calculator POST API ---
app.post('/calculate', [
  body('operation').isIn(['add', 'subtract', 'multiply', 'divide']),
  body('num1').isFloat(),
  body('num2').isFloat()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { operation, num1, num2 } = req.body;
  let result;

  if (operation === 'add') result = num1 + num2;
  else if (operation === 'subtract') result = num1 - num2;
  else if (operation === 'multiply') result = num1 * num2;
  else if (operation === 'divide') {
    if (num2 === 0) return res.status(400).json({ error: 'Cannot divide by zero' });
    result = num1 / num2;
  }

  const stmt = db.prepare(`INSERT INTO history (operation, num1, num2, result) VALUES (?, ?, ?, ?)`);
  stmt.run(operation, num1, num2, result, function (err) {
    if (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ result });
  });
  stmt.finalize();
});

// --- History API ---
app.get('/history', (req, res) => {
  db.all(`SELECT operation, num1, num2, result, timestamp FROM history ORDER BY id DESC LIMIT 100`, [], (err, rows) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ history: rows });
  });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start HTTP server ---
app.listen(port, () => {
  console.log(`🚀 Calculator app running at http://0.0.0.0:${port}`);
});

