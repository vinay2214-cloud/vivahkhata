import imageCompression from 'browser-image-compression';
import { auth } from './firebase';
import type { ParsedAIDraft } from '../components/ai/ConfirmCard';
import { buildContext, toDraft, type AIContext, type RawResult } from './aiDraft';

export type { AIContext } from './aiDraft';

/**
 * Real AI reading for voice notes, bills and UPI screenshots.
 * The browser sends the note/photo to our own server (/api/ai/read), which calls Gemini with the
 * GEMINI_API_KEY stored on Render — the key never reaches the phone.
 * The output is ALWAYS a draft: the user checks it on the ConfirmCard and taps Save.
 * Rule: unknown values stay empty (null). Nothing is guessed.
 */

type ReadRequest =
  | { kind: 'voice'; text: string; context: string }
  | { kind: 'bill'; imageBase64: string; mimeType: string; context: string };

async function readOnServer(body: ReadRequest): Promise<RawResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const token = await user.getIdToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch('/api/ai/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data as { error?: string }).error || `AI request failed (${res.status})`);
      (err as Error & { code?: string }).code = (data as { code?: string }).code || String(res.status);
      throw err;
    }
    return data as RawResult;
  } finally {
    clearTimeout(timer);
  }
}

export async function parseVoiceWithGemini(text: string, ctx: AIContext): Promise<ParsedAIDraft> {
  const raw = await readOnServer({ kind: 'voice', text, context: buildContext(ctx) });
  if (!raw.transcript) raw.transcript = text;
  return toDraft(raw, ctx);
}

async function fileToBase64(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function readBillWithGemini(file: File, ctx: AIContext, thumbnailUrl: string): Promise<ParsedAIDraft> {
  // Shrink phone photos (often 3–8 MB) so they upload quickly on 4G.
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.2,
    initialQuality: 0.75,
    fileType: 'image/jpeg',
    useWebWorker: true,
  });
  const data = await fileToBase64(compressed);
  const raw = await readOnServer({
    kind: 'bill',
    imageBase64: data,
    mimeType: 'image/jpeg',
    context: buildContext(ctx),
  });
  return toDraft(raw, ctx, thumbnailUrl);
}
