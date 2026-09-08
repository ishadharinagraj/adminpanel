const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
require('dotenv').config();

let db = null;
let isFirebaseConfigured = false;

try {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    credential = cert(serviceAccount);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
  }

  if (credential) {
    if (getApps().length === 0) {
      initializeApp({ credential });
    }
    db = getFirestore();
    isFirebaseConfigured = true;
    console.log('🔥 Firebase Admin initialized successfully with credentials!');
  } else {
    console.warn('⚠️ Warning: No Firebase credentials found in environment variables.');
    console.warn('👉 Please set FIREBASE_SERVICE_ACCOUNT in .env or Render Dashboard to connect to your Firebase Firestore database.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

module.exports = { db, FieldValue, isFirebaseConfigured };
