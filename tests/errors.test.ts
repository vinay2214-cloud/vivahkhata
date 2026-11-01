import { describe, it, expect, vi } from 'vitest';
import { errorMessage, timeToDate } from '../src/lib/errors';
import { logger } from '../src/lib/logger';

describe('errorMessage', () => {
  it('uses the message of an Error', () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });
  it('accepts a plain string', () => {
    expect(errorMessage('nope', 'fallback')).toBe('nope');
  });
  it('falls back for empty or unknown values', () => {
    expect(errorMessage(new Error(''), 'fallback')).toBe('fallback');
    expect(errorMessage({ code: 1 }, 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });
});

describe('timeToDate', () => {
  it('reads Firestore-like timestamps', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    expect(timeToDate({ toDate: () => d })).toBe(d);
  });
  it('returns undefined for pending or missing values', () => {
    expect(timeToDate(null)).toBeUndefined();
    expect(timeToDate({ _methodName: 'serverTimestamp' })).toBeUndefined();
  });
});

describe('logger', () => {
  it('forwards warnings and errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.warn('w');
    logger.warn('w', 1);
    logger.error('e');
    logger.error('e', 2);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledTimes(2);
    warn.mockRestore();
    error.mockRestore();
  });
});
