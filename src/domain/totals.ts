import { Expense, Gift, Vendor } from '../types';

export interface WeddingTotals {
  totalSpentPaise: number;
  totalPlannedBudgetPaise: number;
  remainingBudgetPaise: number;
  pendingDuesPaise: number;
  spentByCategoryPaise: Record<string, number>;
  spentByEventPaise: Record<string, number>;
  spentByPayerPaise: Record<string, number>;
  spentByModePaise: Record<string, number>;
  totalGiftsCashPaise: number;
  totalGiftsCount: number;
  totalGiftsGoldMg: number;
  giftsBySidePaise: {
    bride: number;
    groom: number;
    common: number;
  };
}

export function computeWeddingTotals(
  expenses: Expense[],
  gifts: Gift[],
  vendors: Vendor[],
  totalBudgetPaise: number = 0
): WeddingTotals {
  const activeExpenses = expenses.filter((e) => !e.deleted);
  const activeGifts = gifts.filter((g) => !g.deleted);
  const activeVendors = vendors.filter((v) => !v.deleted && !v.archived);

  let totalSpentPaise = 0;
  const spentByCategoryPaise: Record<string, number> = {};
  const spentByEventPaise: Record<string, number> = {};
  const spentByPayerPaise: Record<string, number> = {};
  const spentByModePaise: Record<string, number> = {};

  for (const exp of activeExpenses) {
    totalSpentPaise += exp.amountPaise;

    // By category
    spentByCategoryPaise[exp.categoryId] =
      (spentByCategoryPaise[exp.categoryId] || 0) + exp.amountPaise;

    // By event
    if (exp.eventId) {
      spentByEventPaise[exp.eventId] = (spentByEventPaise[exp.eventId] || 0) + exp.amountPaise;
    }

    // By payer
    const payer = exp.paidByName || 'Unknown';
    spentByPayerPaise[payer] = (spentByPayerPaise[payer] || 0) + exp.amountPaise;

    // By mode
    spentByModePaise[exp.mode] = (spentByModePaise[exp.mode] || 0) + exp.amountPaise;
  }

  // Gifts totals
  let totalGiftsCashPaise = 0;
  let totalGiftsGoldMg = 0;
  const giftsBySidePaise = {
    bride: 0,
    groom: 0,
    common: 0,
  };

  for (const gift of activeGifts) {
    totalGiftsCashPaise += gift.cashPaise || 0;
    if (gift.goldMg) {
      totalGiftsGoldMg += gift.goldMg;
    }
    if (gift.side === 'bride') {
      giftsBySidePaise.bride += gift.cashPaise || 0;
    } else if (gift.side === 'groom') {
      giftsBySidePaise.groom += gift.cashPaise || 0;
    } else {
      giftsBySidePaise.common += gift.cashPaise || 0;
    }
  }

  // Compute pending dues from vendors
  let pendingDuesPaise = 0;
  for (const vendor of activeVendors) {
    const agreed = vendor.agreedPaise || vendor.quotedPaise || 0;
    // Calculate paid to this vendor from linked expenses
    const paidToVendor = activeExpenses
      .filter((e) => e.vendorId === vendor.id)
      .reduce((sum, e) => sum + e.amountPaise, 0);

    const balance = Math.max(0, agreed - paidToVendor);
    pendingDuesPaise += balance;
  }

  const remainingBudgetPaise = Math.max(0, totalBudgetPaise - totalSpentPaise);

  return {
    totalSpentPaise,
    totalPlannedBudgetPaise: totalBudgetPaise,
    remainingBudgetPaise,
    pendingDuesPaise,
    spentByCategoryPaise,
    spentByEventPaise,
    spentByPayerPaise,
    spentByModePaise,
    totalGiftsCashPaise,
    totalGiftsCount: activeGifts.length,
    totalGiftsGoldMg,
    giftsBySidePaise,
  };
}
