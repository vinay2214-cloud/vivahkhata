import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeVendorBalance } from '../src/domain/vendorBalance';
import { expense, vendor } from './fixtures';

describe('computeVendorBalance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T10:00:00+05:30'));
  });
  afterEach(() => vi.useRealTimers());

  const decorator = vendor({
    id: 'v1',
    agreedPaise: 20000000,
    schedule: [
      { id: 's1', label: 'Advance', amountPaise: 5000000, dueDate: '2026-11-01' },
      { id: 's2', label: 'Second', amountPaise: 5000000, dueDate: '2026-11-10' },
      { id: 's3', label: 'Balance', amountPaise: 10000000, dueDate: '2026-11-22' },
    ],
  });

  it('marks paid, overdue and upcoming schedule rows', () => {
    const summary = computeVendorBalance(decorator, [
      expense({ vendorId: 'v1', scheduleItemId: 's1', amountPaise: 5000000 }),
    ]);
    expect(summary.scheduleWithStatus.map((s) => s.status)).toEqual(['paid', 'overdue', 'due']);
    expect(summary.scheduleWithStatus[1].isOverdue).toBe(true);
  });

  it('computes paid, balance and progress from linked expenses only', () => {
    const summary = computeVendorBalance(decorator, [
      expense({ vendorId: 'v1', amountPaise: 5000000 }),
      expense({ vendorId: 'v1', amountPaise: 3000000, deleted: true }), // deleted payment ignored
      expense({ vendorId: 'other', amountPaise: 7000000 }), // other vendor ignored
    ]);
    expect(summary.paidPaise).toBe(5000000);
    expect(summary.balancePaise).toBe(15000000);
    expect(summary.progressPercent).toBe(25);
  });

  it('caps progress at 100% and balance at zero when overpaid', () => {
    const summary = computeVendorBalance(decorator, [
      expense({ vendorId: 'v1', amountPaise: 25000000 }),
    ]);
    expect(summary.balancePaise).toBe(0);
    expect(summary.progressPercent).toBe(100);
  });

  it('falls back to the quoted amount when nothing is agreed yet', () => {
    const summary = computeVendorBalance(vendor({ quotedPaise: 1000000 }), []);
    expect(summary.agreedPaise).toBe(1000000);
    expect(summary.progressPercent).toBe(0);
  });
});
