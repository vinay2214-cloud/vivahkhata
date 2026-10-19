/** Human-friendly message when reading a voice note or bill fails. */
export function aiErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const msg = err instanceof Error ? err.message : String(err);
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'No internet. Reading needs a connection — please type the entry instead.';
  }
  if (code === 'ai_not_configured') return 'AI reading is not switched on for this app yet. Please type the entry for now.';
  if (code === 'rate_limited' || /quota|429|RESOURCE_EXHAUSTED/i.test(msg)) {
    return 'Too many requests right now. Please wait a minute or type the entry.';
  }
  if (code === 'unauthorized') return 'Please sign out and sign in again, then retry.';
  if (/abort/i.test(msg)) return 'Reading took too long. Please try again or type the entry.';
  return "Couldn't read that. Please try again or type the entry.";
}
