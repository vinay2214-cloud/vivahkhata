/**
 * Firebase web app settings for the "vivahkatha" project.
 * Values come from environment variables set on Render (VITE_FIREBASE_*), read at build time.
 * These are NOT secrets — Firebase web settings are public by design; firestore.rules protects the data.
 */
const env = import.meta.env;

const projectId: string = env.VITE_FIREBASE_PROJECT_ID || 'vivahkatha-f164e';
const appId: string = env.VITE_FIREBASE_APP_ID || '';

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  // The sender id is the number inside the app id ("1:<senderId>:web:...").
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appId.split(':')[1] || '',
  appId,
};

export const FIRESTORE_DATABASE_ID: string = env.VITE_FIRESTORE_DATABASE_ID || '(default)';

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId);
