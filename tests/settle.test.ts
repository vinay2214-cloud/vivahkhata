import { describe, expect, it } from 'vitest';
import { settleUp } from '../src/domain/settle';
import { repeatGivers, summariseGivers } from '../src/domain/giverHistory';
import { gift } from './fixtures';

describe('settleUp', () => {
  it('returns nothing when nobody paid', () => {
    expect(settleUp({})).toEqual({ totalPaise: 0, sharePaise: 0, balances: [], transfers: [] });
  });

  it('splits equally and moves the fewest rupees', () => {
    const r = settleUp({ Dad: 600000, Brother: 200000, Aunt: 100000 });
    expect(r.totalPaise).toBe(900000);
    expect(r.sharePaise).toBe(300000);
    expect(r.transfers).toEqual([
      { from: 'Brother', to: 'Dad', amountPaise: 100000 },
      { from: 'Aunt', to: 'Dad', amountPaise: 200000 },
    ]);
  });

  it('balances always add up to exactly zero, even when the total does not divide evenly', () => {
    const r = settleUp({ A: 100001, B: 100000, C: 100000 });
    expect(r.balances.reduce((s, b) => s + b.balancePaise, 0)).toBe(0);
    const moved = r.transfers.reduce((s, t) => s + t.amountPaise, 0);
    const owed = r.balances.filter((b) => b.balancePaise < 0).reduce((s, b) => s - b.balancePaise, 0);
    expect(moved).toBe(owed);
  });

  it('needs no transfers when everyone paid the same', () => {
    expect(settleUp({ A: 5000, B: 5000 }).transfers).toEqual([]);
  });

  it('ignores people who paid nothing', () => {
    expect(settleUp({ A: 0, B: 1000 }).balances).toHaveLength(1);
  });
});

describe('giver history', () => {
  const gifts = [
    gift({ id: '1', giverName: 'Ramesh Garu', nameKey: 'ramesh garu', cashPaise: 500000 }),
    gift({ id: '2', giverName: 'Ramesh Garu', nameKey: 'ramesh garu', cashPaise: 300000, goldMg: 2000 }),
    gift({ id: '3', giverName: 'Sita', nameKey: 'sita', cashPaise: 100000 }),
    gift({ id: '4', giverName: 'Sita', nameKey: 'sita', cashPaise: 999999, deleted: true }),
  ];

  it('combines repeat givers and skips deleted gifts', () => {
    const rows = summariseGivers(gifts);
    expect(rows[0]).toMatchObject({ giverName: 'Ramesh Garu', count: 2, totalCashPaise: 800000, totalGoldMg: 2000 });
    expect(rows.find((r) => r.nameKey === 'sita')).toMatchObject({ count: 1, totalCashPaise: 100000 });
  });

  it('lists only people who gave more than once', () => {
    expect(repeatGivers(gifts).map((g) => g.nameKey)).toEqual(['ramesh garu']);
  });
});
