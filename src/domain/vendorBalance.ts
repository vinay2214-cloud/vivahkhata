import { Vendor, Expense, VendorScheduleItem } from '../types';
import { getTodayDateString } from '../lib/dates';

export interface VendorFinancialSummary {
  agreedPaise: number;
  paidPaise: number;
  balancePaise: number;
  progressPercent: number;
  scheduleWithStatus: Array<
    VendorScheduleItem & {
      status: 'paid' | 'due' | 'overdue';
      isOverdue: boolean;
    }
  >;
}

export function computeVendorBalance(
  vendor: Vendor,
  expenses: Expense[]
): VendorFinancialSummary {
  const activeExpenses = expenses.filter(
    (e) => !e.deleted && e.vendorId === vendor.id
  );

  const agreedPaise = vendor.agreedPaise || vendor.quotedPaise || 0;
  const paidPaise = activeExpenses.reduce((sum, e) => sum + e.amountPaise, 0);
  const balancePaise = Math.max(0, agreedPaise - paidPaise);
  const progressPercent = agreedPaise > 0 ? Math.min(100, Math.round((paidPaise / agreedPaise) * 100)) : 0;

  const today = getTodayDateString();

  const scheduleWithStatus = (vendor.schedule || []).map((item) => {
    // Check if this schedule item has an expense linked to it or if total paid covers it
    const linkedExpense = activeExpenses.find((e) => e.scheduleItemId === item.id);
    const isPaid = !!linkedExpense || item.paid === true;

    let status: 'paid' | 'due' | 'overdue' = 'due';
    if (isPaid) {
      status = 'paid';
    } else if (item.dueDate && item.dueDate < today) {
      status = 'overdue';
    }

    return {
      ...item,
      status,
      isOverdue: status === 'overdue',
    };
  });

  return {
    agreedPaise,
    paidPaise,
    balancePaise,
    progressPercent,
    scheduleWithStatus,
  };
}
