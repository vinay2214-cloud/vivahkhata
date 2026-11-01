import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { HourlyRateLimiter, validateReadRequest, type ReadRequest } from './validate';

/**
 * Builds the Express app. Dependencies (token check, Gemini call) are passed in,
 * so tests can run the real routes without network access or a real API key.
 */
export interface AppDeps {
  /** Returns the Firebase user id for a valid ID token, or throws. */
  verifyToken: (token: string) => Promise<string>;
  /** Reads a validated request with Gemini and returns the parsed JSON, or null if AI is off. */
  readWithAI: ((req: ReadRequest) => Promise<unknown>) | null;
  model: string;
  aiLimitPerHour: number;
  /** Folder with the built React app (omit in tests). */
  distPath?: string;
}

export function createApp(deps: AppDeps) {
  const app = express();
  const limiter = new HourlyRateLimiter(deps.aiLimitPerHour);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=(self), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'Vivah Khata', ai: Boolean(deps.readWithAI), model: deps.model });
  });

  async function requireUser(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Not signed in', code: 'unauthorized' });
    try {
      res.locals.uid = await deps.verifyToken(token);
      next();
    } catch {
      res.status(401).json({ error: 'Sign-in expired. Please sign in again.', code: 'unauthorized' });
    }
  }

  function rateLimit(_req: Request, res: Response, next: NextFunction) {
    if (!limiter.allow(res.locals.uid as string)) {
      return res.status(429).json({ error: 'Too many AI requests this hour.', code: 'rate_limited' });
    }
    next();
  }

  app.post('/api/ai/read', requireUser, rateLimit, async (req, res) => {
    if (!deps.readWithAI) {
      return res.status(503).json({ error: 'AI is not configured on the server.', code: 'ai_not_configured' });
    }
    const checked = validateReadRequest(req.body);
    if (!checked.ok) return res.status(400).json({ error: checked.error, code: 'bad_request' });

    try {
      const parsed = await deps.readWithAI(checked.value);
      console.log(JSON.stringify({ event: 'ai_read', kind: checked.value.kind, ok: true }));
      res.json(parsed);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : String(err);
      // Never log the note or photo — only what went wrong.
      console.error(
        JSON.stringify({ event: 'ai_read', kind: checked.value.kind, ok: false, status, message: message.slice(0, 300) })
      );
      if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
        return res.status(429).json({ error: 'Gemini free limit reached. Try again later.', code: 'rate_limited' });
      }
      if (status === 400 && /API key/i.test(message)) {
        return res.status(503).json({ error: 'Gemini API key is invalid.', code: 'ai_not_configured' });
      }
      res.status(502).json({ error: 'AI could not read this.', code: 'ai_failed' });
    }
  });

  // Malformed JSON bodies and oversized uploads get a clean JSON error.
  app.use('/api', (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const type = (err as { type?: string })?.type;
    if (type === 'entity.too.large') return res.status(413).json({ error: 'Upload too large', code: 'bad_request' });
    if (type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request', code: 'bad_request' });
    next(err);
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  if (deps.distPath) {
    const distPath = deps.distPath;
    app.use('/assets', express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
