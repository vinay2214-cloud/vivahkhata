import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import te from '../src/i18n/te.json';
import hi from '../src/i18n/hi.json';
import { asAppLanguage, nextLanguage } from '../src/i18n';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe('translations', () => {
  it('Telugu and Hindi cover every English key', () => {
    const base = keys(en).sort();
    expect(keys(te).sort()).toEqual(base);
    expect(keys(hi).sort()).toEqual(base);
  });

  it('keeps the placeholders ({{name}}, {{count}}…) in every language', () => {
    const placeholders = (s: string) => (s.match(/{{\w+}}/g) || []).sort().join(',');
    const flat = (o: object, p = ''): Record<string, string> =>
      Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? Object.entries(flat(v, `${p}${k}.`)) : [[`${p}${k}`, v as string]])));
    const e = flat(en);
    for (const other of [flat(te), flat(hi)]) {
      for (const k of Object.keys(e)) expect(placeholders(other[k])).toBe(placeholders(e[k]));
    }
  });

  it('cycles English → Telugu → Hindi → English and ignores unknown values', () => {
    expect(nextLanguage('en')).toBe('te');
    expect(nextLanguage('te')).toBe('hi');
    expect(nextLanguage('hi')).toBe('en');
    expect(asAppLanguage('fr')).toBe('en');
    expect(asAppLanguage(null)).toBe('en');
  });
});
