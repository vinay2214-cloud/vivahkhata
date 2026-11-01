import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createApp } from './app';
import { createGeminiReader } from './gemini';

dotenv.config({ path: ['.env.local', '.env'] });

/**
 * Vivah Khata server (runs on Render as a Web Service).
 *  - Serves the built React app from /dist.
 *  - POST /api/ai/read: reads a voice note or bill photo with Gemini, using GEMINI_API_KEY.
 *    Only signed-in users of this app's Firebase project can call it.
 * All wedding data is read/written by the browser directly in Firestore (protected by firestore.rules).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'vivahkatha-f164e';

// Firebase ID tokens are checked against Google's public keys — no service account needed.
const firebaseKeys = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

async function verifyFirebaseToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, firebaseKeys, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  if (!payload.sub) throw new Error('No user id');
  return payload.sub;
}

const app = createApp({
  verifyToken: verifyFirebaseToken,
  readWithAI: createGeminiReader(GEMINI_API_KEY, GEMINI_MODEL),
  model: GEMINI_MODEL,
  aiLimitPerHour: Number(process.env.AI_LIMIT_PER_HOUR) || 40,
  distPath: path.resolve(__dirname, '../dist'),
});

app.listen(PORT, () => {
  console.log(
    `Vivah Khata running on port ${PORT} (AI ${GEMINI_API_KEY ? 'on' : 'off'}, model ${GEMINI_MODEL})`
  );
});
