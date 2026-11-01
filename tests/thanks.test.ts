import { describe, expect, it } from 'vitest';
import { cleanThanks, templateThanks, whatsappLink } from '../src/lib/thanks';
import { validateReadRequest } from '../server/validate';
import { buildGeminiRequest } from '../server/gemini';

describe('thank-you message helpers', () => {
  it('template mentions the guest, never an amount, in every language', () => {
    for (const lang of ['en', 'te', 'hi'] as const) {
      const m = templateThanks({ giverName: 'Ramesh', hostNames: 'Arjun & Divya' }, lang);
      expect(m).toContain('Ramesh');
      expect(m).toContain('Arjun & Divya');
      expect(m).not.toMatch(/\d|₹|rupee/i);
    }
  });

  it('cleans model output', () => {
    expect(cleanThanks('  hello  ')).toBe('hello');
    expect(cleanThanks('')).toBeNull();
    expect(cleanThanks(42)).toBeNull();
    expect(cleanThanks('a'.repeat(900))!.length).toBeLessThanOrEqual(601);
  });

  it('builds a WhatsApp link, adding 91 to 10-digit numbers', () => {
    expect(whatsappLink('hi there', '98480 11223')).toBe(
      'https://wa.me/919848011223?text=hi%20there'
    );
    expect(whatsappLink('hi')).toBe('https://wa.me/?text=hi');
  });
});

describe('thanks request on the server', () => {
  const good = {
    kind: 'thanks',
    giverName: 'Ramesh',
    relation: 'mama',
    town: 'Guntur',
    amountRupees: 5000,
    hostNames: 'A & D',
    language: 'te',
  };

  it('accepts a normal request', () => {
    expect(validateReadRequest(good).ok).toBe(true);
  });

  it('rejects bad names, amounts and languages', () => {
    expect(validateReadRequest({ ...good, giverName: '' }).ok).toBe(false);
    expect(validateReadRequest({ ...good, giverName: 'x'.repeat(200) }).ok).toBe(false);
    expect(validateReadRequest({ ...good, amountRupees: -1 }).ok).toBe(false);
    expect(validateReadRequest({ ...good, amountRupees: 'lots' }).ok).toBe(false);
    expect(validateReadRequest({ ...good, language: 'fr' }).ok).toBe(false);
  });

  it('tells Gemini not to state the amount and passes only what was given', () => {
    const v = validateReadRequest(good);
    if (!v.ok) throw new Error('should be valid');
    const req = buildGeminiRequest(v.value);
    expect(req.systemInstruction).toMatch(/do NOT write the number/i);
    const text = (req.contents[0].parts[0] as { text: string }).text;
    expect(text).toContain('Guest: Ramesh');
    expect(text).not.toContain('5000');
  });
});
