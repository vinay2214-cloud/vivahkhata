import type { Expense, Gift, Vendor } from '../src/types';

export function expense(overrides: Partial<Expense>): Expense {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    amountPaise: 100000,
    categoryId: 'catering',
    paidByName: 'Srinivasa Rao',
    mode: 'cash',
    type: 'full',
    date: '2026-11-10',
    side: 'common',
    source: 'manual',
    createdBy: 'u1',
    deleted: false,
    ...overrides,
  };
}

export function gift(overrides: Partial<Gift>): Gift {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    giverName: 'Ramesh Garu',
    side: 'common',
    cashPaise: 500000,
    createdBy: 'u1',
    deleted: false,
    ...overrides,
  } as Gift;
}

export function vendor(overrides: Partial<Vendor>): Vendor {
  return {
    id: overrides.id ?? 'v1',
    name: 'Sri Lakshmi Caterers',
    categoryId: 'catering',
    schedule: [],
    createdBy: 'u1',
    deleted: false,
    ...overrides,
  };
}
