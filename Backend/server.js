// server.js - Main Express Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { FIREBASE_DB_ID, FIREBASE_DATABASE_URL } = require('./firebaseConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files directly from Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// Import route modules
const loginRoutes = require('./login');
const sessionRoutes = require('./session');
const wearableRoutes = require('./wearable');
const usersRoutes = require('./users');

// Mount API routes
app.use('/api/auth', loginRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/wearable', wearableRoutes);
app.use('/api/users', usersRoutes);

// Config route (easy Firebase ID replacement for frontend & mobile)
app.get('/api/config', (req, res) => {
  res.json({
    id: FIREBASE_DB_ID,
    firebaseDbId: FIREBASE_DB_ID,
    databaseUrl: FIREBASE_DATABASE_URL,
    firebaseDatabaseUrl: FIREBASE_DATABASE_URL,
    appName: 'Neuro Calm',
    appAlias: 'Neuro Clam'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Neuro Calm backend is running', id: FIREBASE_DB_ID });
});

// Root fallback to frontend index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
