import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { RECEIPT_PROMPT, VOICE_PROMPT } from './prompts';

dotenv.config({ path: ['.env.local', '.env'] });

/**
 * Vivah Khata server (runs on Render as a Web Service).
 *  - Serves the built React app from /dist.
 *  - POST /api/ai/read: reads a voice note or bill photo with Gemini, using GEMINI_API_KEY.
 *    Only signed-in users of this app's Firebase project can call it.
 * All wedding data is still read/written by the browser directly in Firestore (protected by firestore.rules).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'vivahkatha-f164e';
const AI_LIMIT_PER_HOUR = Number(process.env.AI_LIMIT_PER_HOUR) || 40;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '4mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(self)');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'Vivah Khata', ai: Boolean(GEMINI_API_KEY), model: GEMINI_MODEL });
});

// ---------- Sign-in check (Firebase ID token) ----------
const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Not signed in', code: 'unauthorized' });
  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub) throw new Error('No user id');
    res.locals.uid = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Sign-in expired. Please sign in again.', code: 'unauthorized' });
  }
}

// ---------- Simple per-user rate limit (protects your free Gemini quota) ----------
const usage = new Map<string, number[]>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const uid = res.locals.uid as string;
  const now = Date.now();
  const recent = (usage.get(uid) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= AI_LIMIT_PER_HOUR) {
    return res.status(429).json({ error: 'Too many AI requests this hour.', code: 'rate_limited' });
  }
  recent.push(now);
  usage.set(uid, recent);
  next();
}

// ---------- Gemini ----------
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const nullableString = { type: Type.STRING, nullable: true };
const nullableNumber = { type: Type.NUMBER, nullable: true };
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING, enum: ['expense', 'gift', 'unknown'] },
    transcript: nullableString,
    amountRupees: nullableNumber,
    categoryId: nullableString,
    vendorName: nullableString,
    paidByName: nullableString,
    mode: nullableString,
    type: nullableString,
    eventName: nullableString,
    date: nullableString,
    upiRef: nullableString,
    note: nullableString,
    giverName: nullableString,
    relation: nullableString,
    town: nullableString,
    goldGrams: nullableNumber,
    items: nullableString,
    uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['kind', 'uncertainFields', 'warnings'],
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BASE64 = 3_000_000; // ≈2.2 MB image
const MAX_TEXT = 1_000;
const MAX_CONTEXT = 20_000;

app.post('/api/ai/read', requireUser, rateLimit, async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'AI is not configured on the server.', code: 'ai_not_configured' });
  }

  const { kind, text, imageBase64, mimeType, context } = req.body || {};
  if (typeof context !== 'string' || context.length > MAX_CONTEXT) {
    return res.status(400).json({ error: 'Bad request', code: 'bad_request' });
  }

  let systemInstruction: string;
  let contents: Array<{ role: 'user'; parts: Array<Record<string, unknown>> }>;

  if (kind === 'voice') {
    if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) {
      return res.status(400).json({ error: 'Note is empty or too long', code: 'bad_request' });
    }
    systemInstruction = VOICE_PROMPT;
    contents = [{ role: 'user', parts: [{ text: `Context: ${context}` }, { text: `Spoken note: ${text}` }] }];
  } else if (kind === 'bill') {
    if (
      typeof imageBase64 !== 'string' ||
      !imageBase64 ||
      imageBase64.length > MAX_IMAGE_BASE64 ||
      !ALLOWED_IMAGE_TYPES.includes(mimeType)
    ) {
      return res.status(400).json({ error: 'Photo missing or too large', code: 'bad_request' });
    }
    systemInstruction = RECEIPT_PROMPT;
    contents = [
      {
        role: 'user',
        parts: [{ text: `Context: ${context}` }, { inlineData: { data: imageBase64, mimeType } }],
      },
    ];
  } else {
    return res.status(400).json({ error: 'Unknown request', code: 'bad_request' });
  }

  const call = () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

  try {
    let result;
    try {
      result = await call();
    } catch (first) {
      // One retry for brief network / server hiccups.
      const status = (first as { status?: number }).status;
      if (status && status < 500 && status !== 429) throw first;
      await new Promise((r) => setTimeout(r, 800));
      result = await call();
    }
    const parsed = JSON.parse(result.text || '{}');
    console.log(JSON.stringify({ event: 'ai_read', kind, ok: true, tokens: result.usageMetadata?.totalTokenCount }));
    res.json(parsed);
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : String(err);
    // Never log the note or photo — only what went wrong.
    console.error(JSON.stringify({ event: 'ai_read', kind, ok: false, status, message: message.slice(0, 300) }));
    if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
      return res.status(429).json({ error: 'Gemini free limit reached. Try again later.', code: 'rate_limited' });
    }
    if (status === 400 && /API key/i.test(message)) {
      return res.status(503).json({ error: 'Gemini API key is invalid.', code: 'ai_not_configured' });
    }
    res.status(502).json({ error: 'AI could not read this.', code: 'ai_failed' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- The React app ----------
const distPath = path.resolve(__dirname, '../dist');
app.use(
  '/assets',
  express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y' })
);
app.use(express.static(distPath, { index: false, maxAge: '1h' }));
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vivah Khata running on port ${PORT} (AI ${GEMINI_API_KEY ? 'on' : 'off'}, model ${GEMINI_MODEL})`);
});
