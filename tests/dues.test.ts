import { describe, it, expect } from 'vitest';
import { pendingDues } from '../src/domain/dues';
import type { Vendor } from '../src/types';

const vendor = (name: string, schedule: Vendor['schedule']): Vendor =>
  ({ id: name, name, categoryId: 'food', agreedAmountPaise: 0, schedule }) as unknown as Vendor;

describe('pendingDues', () => {
  it('lists only unpaid instalments, overdue first then by date', () => {
    const vendors = [
      vendor('Caterer', [
        { id: 'a', label: 'Advance', amountPaise: 100, dueDate: '2000-01-01', paid: false },
        { id: 'b', label: 'Balance', amountPaise: 200, dueDate: '2999-01-01', paid: false },
        { id: 'c', label: 'Token', amountPaise: 50, dueDate: '2000-01-01', paid: true },
      ]),
      vendor('Decor', [
        { id: 'd', label: 'Half', amountPaise: 300, dueDate: '2998-01-01', paid: false },
      ]),
    ];
    const dues = pendingDues(vendors, []);
    expect(dues.map((d) => d.label)).toEqual(['Advance', 'Half', 'Balance']);
    expect(dues[0].status).toBe('overdue');
  });
  it('returns nothing when there are no vendors', () => {
    expect(pendingDues([], [])).toEqual([]);
  });
});
