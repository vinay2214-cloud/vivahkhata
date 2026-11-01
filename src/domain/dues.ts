import type { Expense, Vendor } from '../types';
import { computeVendorBalance } from './vendorBalance';

export interface DueItem {
  vendorName: string;
  label: string;
  amountPaise: number;
  dueDate: string;
  status: 'due' | 'overdue';
}

/** All unpaid vendor instalments, overdue first, then by earliest due date. */
export function pendingDues(vendors: Vendor[], expenses: Expense[]): DueItem[] {
  const items: DueItem[] = [];
  for (const v of vendors) {
    for (const item of computeVendorBalance(v, expenses).scheduleWithStatus) {
      if (item.status === 'paid') continue;
      items.push({
        vendorName: v.name,
        label: item.label,
        amountPaise: item.amountPaise,
        dueDate: item.dueDate,
        status: item.status,
      });
    }
  }
  items.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'overdue' ? -1 : 1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });
  return items;
}
