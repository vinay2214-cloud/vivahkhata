import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../server/app';
import { buildGeminiRequest } from '../server/gemini';
import { HourlyRateLimiter, MAX_TEXT, validateReadRequest } from '../server/validate';

describe('request validation', () => {
  it('accepts a normal voice note', () => {
    const r = validateReadRequest({ kind: 'voice', text: '  caterer ki 5000 ', context: '{}' });
    expect(r).toEqual({
      ok: true,
      value: { kind: 'voice', text: 'caterer ki 5000', context: '{}' },
    });
  });

  it('rejects empty, oversized or unknown requests', () => {
    expect(validateReadRequest(null).ok).toBe(false);
    expect(validateReadRequest({ kind: 'voice', text: '   ', context: '{}' }).ok).toBe(false);
    expect(
      validateReadRequest({ kind: 'voice', text: 'a'.repeat(MAX_TEXT + 1), context: '{}' }).ok
    ).toBe(false);
    expect(validateReadRequest({ kind: 'voice', text: 'hi' }).ok).toBe(false); // no context
    expect(validateReadRequest({ kind: 'sql', text: 'hi', context: '{}' }).ok).toBe(false);
  });

  it('only accepts real base64 images of allowed types', () => {
    expect(
      validateReadRequest({
        kind: 'bill',
        imageBase64: 'aGVsbG8=',
        mimeType: 'image/jpeg',
        context: '{}',
      }).ok
    ).toBe(true);
    expect(
      validateReadRequest({
        kind: 'bill',
        imageBase64: 'aGVsbG8=',
        mimeType: 'application/pdf',
        context: '{}',
      }).ok
    ).toBe(false);
    expect(
      validateReadRequest({
        kind: 'bill',
        imageBase64: '<html>',
        mimeType: 'image/png',
        context: '{}',
      }).ok
    ).toBe(false);
  });
});

describe('rate limiter', () => {
  it('allows N calls per hour per user, then blocks, then recovers', () => {
    const limiter = new HourlyRateLimiter(2);
    const t = 1_000_000;
    expect(limiter.allow('u1', t)).toBe(true);
    expect(limiter.allow('u1', t + 1)).toBe(true);
    expect(limiter.allow('u1', t + 2)).toBe(false);
    expect(limiter.allow('u2', t + 2)).toBe(true); // other users unaffected
    expect(limiter.allow('u1', t + 60 * 60 * 1000 + 1)).toBe(true);
  });
});

describe('Gemini request', () => {
  it('sends the photo as inline data with the receipt instructions', () => {
    const req = buildGeminiRequest({
      kind: 'bill',
      imageBase64: 'aGVsbG8=',
      mimeType: 'image/png',
      context: '{"today":"x"}',
    });
    expect(req.systemInstruction).toMatch(/bill/i);
    expect(req.contents[0].parts[1]).toEqual({
      inlineData: { data: 'aGVsbG8=', mimeType: 'image/png' },
    });
  });
});

describe('HTTP API', () => {
  const readWithAI = vi.fn(async () => ({
    kind: 'expense',
    amountRupees: 40000,
    uncertainFields: [],
    warnings: [],
  }));
  const app = createApp({
    verifyToken: async (token) => {
      if (token === 'good-token') return 'user-1';
      throw new Error('bad token');
    },
    readWithAI,
    model: 'test-model',
    aiLimitPerHour: 3,
  });
  let base = '';
  let server: ReturnType<typeof app.listen>;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => server.close());

  const post = (body: unknown, token?: string) =>
    fetch(`${base}/api/ai/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

  it('reports health without exposing secrets', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(await res.json()).toEqual({
      ok: true,
      app: 'Vivah Khata',
      ai: true,
      model: 'test-model',
    });
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('refuses AI reading without a valid sign-in', async () => {
    expect((await post({ kind: 'voice', text: 'hi', context: '{}' })).status).toBe(401);
    expect((await post({ kind: 'voice', text: 'hi', context: '{}' }, 'forged')).status).toBe(401);
    expect(readWithAI).not.toHaveBeenCalled();
  });

  it('rejects bad input before calling Gemini', async () => {
    expect((await post({ kind: 'voice', text: '', context: '{}' }, 'good-token')).status).toBe(400);
    expect((await post('{not json', 'good-token')).status).toBe(400);
    expect(readWithAI).not.toHaveBeenCalled();
  });

  it('returns the AI reading for a signed-in user, then rate-limits', async () => {
    const ok = await post(
      { kind: 'voice', text: 'caterer ki 40 thousand', context: '{}' },
      'good-token'
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ amountRupees: 40000 });
    // Limit is 3 per hour in this test app. Used so far: 1 rejected-empty note + 1 success
    // (malformed JSON is refused before sign-in, so it never counts).
    expect((await post({ kind: 'voice', text: 'again', context: '{}' }, 'good-token')).status).toBe(
      200
    );
    const blocked = await post({ kind: 'voice', text: 'one more', context: '{}' }, 'good-token');
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).code).toBe('rate_limited');
  });

  it('turns Gemini quota errors into a clear 429', async () => {
    const failing = createApp({
      verifyToken: async () => 'user-2',
      readWithAI: async () => {
        throw Object.assign(new Error('RESOURCE_EXHAUSTED'), { status: 429 });
      },
      model: 'm',
      aiLimitPerHour: 10,
    });
    const s = failing.listen(0);
    await new Promise((r) => s.once('listening', r));
    const res = await fetch(`http://127.0.0.1:${(s.address() as AddressInfo).port}/api/ai/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer x' },
      body: JSON.stringify({ kind: 'voice', text: 'hi', context: '{}' }),
    });
    s.close();
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('rate_limited');
  });

  it('answers 503 when no Gemini key is configured', async () => {
    const noAi = createApp({
      verifyToken: async () => 'u',
      readWithAI: null,
      model: 'm',
      aiLimitPerHour: 10,
    });
    const s = noAi.listen(0);
    await new Promise((r) => s.once('listening', r));
    const port = (s.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer x' },
      body: JSON.stringify({ kind: 'voice', text: 'hi', context: '{}' }),
    });
    s.close();
    expect(res.status).toBe(503);
  });
});
