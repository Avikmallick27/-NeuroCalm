// Centralized Firebase configuration
// To connect your database, replace FIREBASE_DB_ID with your database identifier:
// Example: id = "test-project93-default-rtdb" -> https://test-project93-default-rtdb.firebaseio.com

const FIREBASE_DB_ID = process.env.FIREBASE_DB_ID || 'neuro-tech-01-default-rtdb';
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || `https://${FIREBASE_DB_ID}.firebaseio.com`;

module.exports = {
  FIREBASE_DB_ID,
  FIREBASE_DATABASE_URL,
  getDatabaseURL: (id = FIREBASE_DB_ID) => `https://${id}.firebaseio.com`
};
