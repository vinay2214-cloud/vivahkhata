import { describe, expect, it } from 'vitest';
import {
  buildContext,
  cleanAmount,
  cleanDate,
  matchByName,
  toDraft,
  type AIContext,
  type RawResult,
} from '../src/lib/aiDraft';
import type { Member, Vendor, WeddingEvent } from '../src/types';

const ctx: AIContext = {
  categories: [
    { id: 'catering', label: 'Catering', icon: 'x' },
    { id: 'misc', label: 'Misc', icon: 'x' },
    { id: 'secret', label: 'Hidden', icon: 'x', hidden: true },
  ],
  vendors: [
    {
      id: 'v1',
      name: 'Sri Lakshmi Caterers',
      categoryId: 'catering',
      schedule: [],
      createdBy: 'u',
      deleted: false,
    } as Vendor,
    {
      id: 'v9',
      name: 'Old Vendor',
      categoryId: 'misc',
      schedule: [],
      createdBy: 'u',
      deleted: true,
    } as Vendor,
  ],
  members: [
    {
      uid: 'u1',
      displayName: 'Kiran Kumar',
      role: 'editor',
      side: 'bride',
      removed: false,
    } as Member,
    {
      uid: 'u2',
      displayName: 'Removed Person',
      role: 'viewer',
      side: 'bride',
      removed: true,
    } as Member,
  ],
  events: [
    {
      id: 'e1',
      name: 'Mehendi',
      type: 'mehendi',
      order: 1,
      createdBy: 'u',
      deleted: false,
    } as WeddingEvent,
  ],
  speakerName: 'Lakshmi',
};

function raw(overrides: Partial<RawResult>): RawResult {
  return {
    kind: 'expense',
    transcript: null,
    amountRupees: null,
    categoryId: null,
    vendorName: null,
    paidByName: null,
    mode: null,
    type: null,
    eventName: null,
    date: null,
    upiRef: null,
    note: null,
    giverName: null,
    relation: null,
    town: null,
    goldGrams: null,
    items: null,
    uncertainFields: [],
    warnings: [],
    ...overrides,
  };
}

describe('AI context sent to Gemini', () => {
  it('only includes visible categories, active vendors and current members', () => {
    const json = JSON.parse(buildContext(ctx));
    expect(json.categories.map((c: { id: string }) => c.id)).toEqual(['catering', 'misc']);
    expect(json.vendors).toEqual(['Sri Lakshmi Caterers']);
    expect(json.members).toEqual(['Kiran Kumar']);
    expect(json.timezone).toBe('Asia/Kolkata');
    expect(json.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('turning Gemini output into a safe draft', () => {
  it('maps spoken names to real vendor, member and event records', () => {
    const d = toDraft(
      raw({
        amountRupees: 40000,
        categoryId: 'catering',
        vendorName: 'lakshmi caterers',
        paidByName: 'kiran',
        eventName: 'mehendi',
        mode: 'cash',
        type: 'advance',
      }),
      ctx
    );
    expect(d.expense).toMatchObject({
      vendorId: 'v1',
      vendorName: 'Sri Lakshmi Caterers',
      paidByUid: 'u1',
      eventId: 'e1',
      mode: 'cash',
      type: 'advance',
    });
    expect(d.confidence?.['expense.amountRupees']).toBe('high');
  });

  it('marks fields Gemini was unsure about as low confidence', () => {
    const d = toDraft(raw({ amountRupees: 5000, uncertainFields: ['amountRupees'] }), ctx);
    expect(d.confidence?.['expense.amountRupees']).toBe('low');
  });

  it('rejects categories, modes and types that do not exist', () => {
    const d = toDraft(
      raw({ amountRupees: 100, categoryId: 'secret', mode: 'bitcoin', type: 'loan' }),
      ctx
    );
    expect(d.expense?.categoryId).toBe('misc');
    expect(d.confidence?.['expense.categoryId']).toBe('low');
    expect(d.expense?.mode).toBeNull();
    expect(d.expense?.type).toBeNull();
  });

  it('drops impossible amounts and bad dates instead of saving them', () => {
    const d = toDraft(raw({ amountRupees: -5, date: '22/11/2026' }), ctx);
    expect(d.expense?.amountRupees).toBeNull();
    expect(d.expense?.date).toBeNull();
    expect(d.warnings?.join(' ')).toMatch(/amount/i);
  });

  it('strips spaces from UPI references for duplicate checks', () => {
    expect(toDraft(raw({ amountRupees: 10, upiRef: 'T2610 1903 1204' }), ctx).expense?.upiRef).toBe(
      'T261019031204'
    );
  });

  it('builds gift drafts and ignores silly gold weights', () => {
    const d = toDraft(
      raw({
        kind: 'gift',
        giverName: ' Ramesh Garu ',
        town: 'Guntur',
        amountRupees: 5000,
        goldGrams: 99999,
      }),
      ctx
    );
    expect(d.kind).toBe('gift');
    expect(d.gift).toMatchObject({
      giverName: 'Ramesh Garu',
      town: 'Guntur',
      cashRupees: 5000,
      goldGrams: null,
    });
  });

  it('turns unknown readings into a friendly "type it instead" message', () => {
    expect(toDraft(raw({ kind: 'unknown' }), ctx).warnings?.[0]).toMatch(/type it/i);
    expect(
      toDraft(raw({ kind: 'unknown', warnings: ["This app doesn't record dowry."] }), ctx).warnings
    ).toEqual(["This app doesn't record dowry."]);
  });
});

describe('small helpers', () => {
  it('matchByName needs at least 3 characters and prefers exact matches', () => {
    const items = [{ n: 'Ravi' }, { n: 'Ravi Teja' }];
    expect(matchByName('ra', items, (i) => i.n)).toBeUndefined();
    expect(matchByName('ravi', items, (i) => i.n)?.n).toBe('Ravi');
    expect(matchByName(null, items, (i) => i.n)).toBeUndefined();
  });

  it('cleanAmount and cleanDate accept only sensible values', () => {
    const w: string[] = [];
    expect(cleanAmount(1500.456, w)).toBe(1500.46);
    expect(cleanAmount(2_000_000_000, w)).toBeNull();
    expect(cleanDate('2026-11-22')).toBe('2026-11-22');
    expect(cleanDate('2026-13-45')).toBeNull();
  });
});
