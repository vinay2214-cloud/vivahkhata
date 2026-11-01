/**
 * Single place for diagnostics. Errors and warnings are surfaced in the
 * browser console during development and in production (they help support),
 * but call sites never touch `console` directly, so the output can later be
 * routed to a reporting service without editing every component.
 */
export const logger = {
  warn(message: string, detail?: unknown): void {
    if (detail === undefined) console.warn(message);
    else console.warn(message, detail);
  },
  error(message: string, detail?: unknown): void {
    if (detail === undefined) console.error(message);
    else console.error(message, detail);
  },
};
