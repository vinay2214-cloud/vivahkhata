/**
 * Turn anything that was thrown into a short, user-presentable message.
 * `catch (err)` is `unknown` in strict TypeScript, so every call site goes
 * through here instead of reaching into `err.message` unchecked.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

/** Read a Firestore timestamp-like value as a Date; `undefined` while a server timestamp is still pending. */
export function timeToDate(value: unknown): Date | undefined {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}
