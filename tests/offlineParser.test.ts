import { describe, expect, it } from 'vitest';
import { parseSpokenTextToDraft } from '../src/lib/aiParser';

const categories = [
  'venue',
  'catering',
  'decoration',
  'photography',
  'clothing',
  'priest',
  'transport',
  'misc',
].map((id) => ({
  id,
  label: id,
}));
const parse = (text: string) => parseSpokenTextToDraft(text, categories);

describe('offline voice parser (fallback when AI is unreachable)', () => {
  it('reads a Telugu-English catering advance', () => {
    const d = parse('caterer ki 40 thousand advance ichhamu cash lo, mama pay chesaru');
    expect(d.kind).toBe('expense');
    expect(d.expense).toMatchObject({
      amountRupees: 40000,
      categoryId: 'catering',
      mode: 'cash',
      type: 'advance',
      paidByName: 'Mama',
    });
  });

  it('understands Telugu number words with "nara" (and a half)', () => {
    expect(parse('okati nara laksha').expense?.amountRupees).toBe(150000);
    expect(parse('nalabhai vela phonepe photographer').expense).toMatchObject({
      amountRupees: 40000,
      mode: 'upi',
      categoryId: 'photography',
    });
    expect(parse('ninna decoration vallaki oka laksha balance ichhamu').expense).toMatchObject({
      amountRupees: 100000,
      type: 'balance',
    });
  });

  it('reads Hindi', () => {
    expect(parse('pandit ji ko 11000 diye').expense).toMatchObject({
      amountRupees: 11000,
      categoryId: 'priest',
    });
  });

  it('recognises gifts received, including gold', () => {
    const cash = parse('Ramesh garu Guntur nunchi 5000 icharu');
    expect(cash.kind).toBe('gift');
    expect(cash.gift?.cashRupees).toBe(5000);

    const gold = parse('Sita akka rendu grams bangaram ungaram ichindi');
    expect(gold.gift).toMatchObject({ goldGrams: 2, items: 'Ring', cashRupees: null });
  });

  it('NEVER invents an amount, name or payer it did not hear', () => {
    const d = parse('hello there');
    expect(d.expense?.amountRupees).toBeNull();
    expect(d.expense?.paidByName).toBeNull();
    expect(d.warnings?.join(' ')).toMatch(/amount/i);

    const g = parse('Ramesh garu Guntur nunchi 5000 icharu');
    expect(g.gift?.giverName).toBeNull(); // the person types the name; the parser never guesses
  });

  it('refuses to record dowry', () => {
    const d = parse('dowry 5 lakhs');
    expect(d.kind).toBe('unknown');
    expect(d.warnings).toContain("This app doesn't record dowry.");
  });

  it('only suggests categories that exist in this wedding', () => {
    const d = parseSpokenTextToDraft('caterer ki 5000', [{ id: 'misc', label: 'Misc' }]);
    expect(d.expense?.categoryId).toBeNull();
  });
});
