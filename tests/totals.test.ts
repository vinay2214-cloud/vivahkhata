import { describe, expect, it } from 'vitest';
import { computeWeddingTotals } from '../src/domain/totals';
import { expense, gift, vendor } from './fixtures';

describe('computeWeddingTotals', () => {
  const expenses = [
    expense({
      amountPaise: 4000000,
      categoryId: 'catering',
      paidByName: 'Kiran',
      mode: 'upi',
      eventId: 'e1',
      vendorId: 'v1',
    }),
    expense({
      amountPaise: 2500000,
      categoryId: 'photography',
      paidByName: 'Kiran',
      mode: 'cash',
      eventId: 'e2',
    }),
    expense({
      amountPaise: 1000000,
      categoryId: 'catering',
      paidByName: 'Lakshmi',
      mode: 'cash',
      eventId: 'e1',
    }),
    expense({ amountPaise: 9900000, categoryId: 'venue', deleted: true }), // soft-deleted: must be ignored
  ];
  const gifts = [
    gift({ cashPaise: 500000, side: 'bride', goldMg: 2000 }),
    gift({ cashPaise: 1000000, side: 'groom' }),
    gift({ cashPaise: 200000, side: 'common' }),
    gift({ cashPaise: 9999900, side: 'bride', deleted: true }), // soft-deleted
  ];
  const vendors = [
    vendor({ id: 'v1', agreedPaise: 10000000 }),
    vendor({ id: 'v2', quotedPaise: 3000000 }), // no agreement yet: quote counts as due
    vendor({ id: 'v3', agreedPaise: 5000000, archived: true }), // archived: not due
  ];

  const totals = computeWeddingTotals(expenses, gifts, vendors, 20000000);

  it('adds up only active expenses', () => {
    expect(totals.totalSpentPaise).toBe(7500000);
    expect(totals.remainingBudgetPaise).toBe(12500000);
  });

  it('splits spending by category, event, payer and payment mode', () => {
    expect(totals.spentByCategoryPaise).toEqual({ catering: 5000000, photography: 2500000 });
    expect(totals.spentByEventPaise).toEqual({ e1: 5000000, e2: 2500000 });
    expect(totals.spentByPayerPaise).toEqual({ Kiran: 6500000, Lakshmi: 1000000 });
    expect(totals.spentByModePaise).toEqual({ upi: 4000000, cash: 3500000 });
  });

  it('computes pending vendor dues from agreed amount minus linked payments', () => {
    // v1: 1,00,000 agreed − 40,000 paid = 60,000; v2: 30,000 quoted; v3 archived
    expect(totals.pendingDuesPaise).toBe(6000000 + 3000000);
  });

  it('totals gifts, gold and the bride/groom split', () => {
    expect(totals.totalGiftsCount).toBe(3);
    expect(totals.totalGiftsCashPaise).toBe(1700000);
    expect(totals.totalGiftsGoldMg).toBe(2000);
    expect(totals.giftsBySidePaise).toEqual({ bride: 500000, groom: 1000000, common: 200000 });
  });

  it('never shows a negative remaining budget when overspent', () => {
    const over = computeWeddingTotals([expense({ amountPaise: 500 })], [], [], 100);
    expect(over.remainingBudgetPaise).toBe(0);
  });

  it('handles an empty wedding', () => {
    const empty = computeWeddingTotals([], [], []);
    expect(empty.totalSpentPaise).toBe(0);
    expect(empty.pendingDuesPaise).toBe(0);
    expect(empty.totalGiftsCount).toBe(0);
  });
});
