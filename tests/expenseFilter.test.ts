import { describe, it, expect } from 'vitest';
import { filterExpenses, groupExpensesByDate } from '../src/domain/expenseFilter';
import type { Expense, Vendor } from '../src/types';

const vendors = [{ id: 'v1', name: 'Sri Caterers' }] as Vendor[];
const make = (o: Partial<Expense>): Expense =>
  ({ id: 'x', amountPaise: 100, categoryId: 'food', date: '2026-02-01', ...o }) as Expense;
const expenses = [
  make({ id: 'a', vendorId: 'v1', paidByName: 'Ravi' }),
  make({ id: 'b', categoryId: 'decor', note: 'Flowers', paidByName: 'Anil', date: '2026-02-02' }),
  make({ id: 'c', date: '' }),
];

describe('filterExpenses', () => {
  it('returns everything with no filter', () => {
    expect(filterExpenses(expenses, vendors, { categoryId: 'all', query: '  ' })).toHaveLength(3);
  });
  it('filters by category', () => {
    const r = filterExpenses(expenses, vendors, { categoryId: 'decor', query: '' });
    expect(r.map((e) => e.id)).toEqual(['b']);
  });
  it('searches vendor name, note and payer case-insensitively', () => {
    const ids = (q: string) =>
      filterExpenses(expenses, vendors, { categoryId: 'all', query: q }).map((e) => e.id);
    expect(ids('sri')).toEqual(['a']);
    expect(ids('FLOWERS')).toEqual(['b']);
    expect(ids('anil')).toEqual(['b']);
    expect(ids('zzz')).toEqual([]);
  });
});

describe('groupExpensesByDate', () => {
  it('groups by date and puts undated under Earlier', () => {
    const g = groupExpensesByDate(expenses);
    expect(Object.keys(g).sort()).toEqual(['2026-02-01', '2026-02-02', 'Earlier']);
    expect(g['2026-02-01']).toHaveLength(1);
  });
});
