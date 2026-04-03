const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const itemsRouter = require('./routes/items');
const billsRouter = require('./routes/bills');
const authRouter = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const seedAdmin = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Serve built frontend (for production) ────────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendDist));

// ─── Public routes (no auth needed) ──────────────────────────────────────────
app.use('/api/auth', authRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Protected API routes (JWT required) ─────────────────────────────────────
app.use('/api/items', requireAuth, itemsRouter);
app.use('/api/bills', requireAuth, billsRouter);

// ─── Catch-all → serve React frontend ────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── Connect to MongoDB Atlas then start server ───────────────────────────────
if (!MONGODB_URI) {
  console.error('\n❌  MONGODB_URI is not set in server/.env\n');
  console.error('    Copy server/.env.example → server/.env and fill in your Atlas connection string.\n');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅  Connected to MongoDB Atlas');
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀  ShopMate server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
