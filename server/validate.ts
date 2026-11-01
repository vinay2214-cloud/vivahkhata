/**
 * Input checks for POST /api/ai/read. Pure functions — unit-tested in tests/server.validate.test.ts.
 * Anything that fails here is rejected before it can reach Gemini (protects quota and the key).
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BASE64 = 3_000_000; // ≈2.2 MB image
export const MAX_TEXT = 1_000;
export const MAX_CONTEXT = 20_000;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export type ReadRequest =
  | { kind: 'voice'; text: string; context: string }
  | { kind: 'bill'; imageBase64: string; mimeType: ImageType; context: string };

export type ValidationResult = { ok: true; value: ReadRequest } | { ok: false; error: string };

export function validateReadRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Bad request' };
  const { kind, text, imageBase64, mimeType, context } = body as Record<string, unknown>;

  if (typeof context !== 'string' || context.length > MAX_CONTEXT) {
    return { ok: false, error: 'Bad request' };
  }

  if (kind === 'voice') {
    if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) {
      return { ok: false, error: 'Note is empty or too long' };
    }
    return { ok: true, value: { kind, text: text.trim(), context } };
  }

  if (kind === 'bill') {
    if (
      typeof imageBase64 !== 'string' ||
      !imageBase64 ||
      imageBase64.length > MAX_IMAGE_BASE64 ||
      !BASE64.test(imageBase64) ||
      typeof mimeType !== 'string' ||
      !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)
    ) {
      return { ok: false, error: 'Photo missing, too large or not an image' };
    }
    return {
      ok: true,
      value: { kind, imageBase64, mimeType: mimeType as ImageType, context },
    };
  }

  return { ok: false, error: 'Unknown request' };
}

/** Sliding one-hour window, per user. Kept in memory (fine for one small server). */
export class HourlyRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60 * 60 * 1000
  ) {}

  /** Returns true if the call is allowed (and records it). */
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
