// Centralized Frontend Firebase configuration
// To connect your database, replace FIREBASE_DB_ID with your database identifier:
// Example: id = "test-project93-default-rtdb" -> https://test-project93-default-rtdb.firebaseio.com

export const FIREBASE_DB_ID = "neuro-tech-01-default-rtdb";
export const FIREBASE_DATABASE_URL = `https://${FIREBASE_DB_ID}.firebaseio.com`;

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCjQ6Ebt8nDX1K96HsBVkj21DPteU78g0I",
  authDomain: `${FIREBASE_DB_ID}.firebaseapp.com`,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_DB_ID.replace(/-default-rtdb$/, ''),
  storageBucket: `${FIREBASE_DB_ID}.firebasestorage.app`,
  messagingSenderId: "1073828205384",
  appId: "1:1073828205384:web:be73de1f4e60afd81b597d",
  measurementId: "G-KTBVX7NQCL"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app, FIREBASE_DATABASE_URL);
