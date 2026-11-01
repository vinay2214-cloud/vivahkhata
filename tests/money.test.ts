import { describe, expect, it } from 'vitest';
import { compactINR, formatGoldMg, formatINR, fromPaise, toPaise } from '../src/lib/money';

describe('money helpers (amounts stored as integer paise)', () => {
  it('converts rupees to paise without floating point drift', () => {
    expect(toPaise(1234.56)).toBe(123456);
    expect(toPaise(0.1 + 0.2)).toBe(30);
    expect(toPaise(Number.NaN)).toBe(0);
  });

  it('converts paise back to rupees', () => {
    expect(fromPaise(123456)).toBe(1234.56);
    expect(fromPaise(null)).toBe(0);
    expect(fromPaise(undefined)).toBe(0);
  });

  it('formats in Indian digit grouping (lakhs)', () => {
    expect(formatINR(12345600)).toBe('₹1,23,456');
    expect(formatINR(1000000000)).toBe('₹1,00,00,000');
    expect(formatINR(null)).toBe('₹0');
  });

  it('formats compact amounts as K, L and Cr', () => {
    expect(compactINR(4500000)).toBe('₹45K');
    expect(compactINR(15000000)).toBe('₹1.5L');
    expect(compactINR(250000000)).toBe('₹25L'); // ₹25,00,000
    expect(compactINR(2500000000)).toBe('₹2.5Cr'); // ₹2,50,00,000
    expect(compactINR(50000)).toBe('₹500');
    expect(compactINR(-15000000)).toBe('-₹1.5L');
  });

  it('formats gold weight from milligrams', () => {
    expect(formatGoldMg(2000)).toBe('2g');
    expect(formatGoldMg(2500)).toBe('2.50g');
    expect(formatGoldMg(0)).toBe('');
    expect(formatGoldMg(null)).toBe('');
  });
});
