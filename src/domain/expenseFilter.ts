import type { Expense, Vendor } from '../types';

export interface ExpenseFilter {
  /** `'all'` or a category id. */
  categoryId: string;
  /** Free-text search over title, note, payer, category and vendor name. */
  query: string;
}

/** Expenses matching the category chip and the search text (case-insensitive). */
export function filterExpenses(
  expenses: Expense[],
  vendors: Vendor[],
  { categoryId, query }: ExpenseFilter
): Expense[] {
  const needle = query.trim().toLowerCase();
  return expenses.filter((e) => {
    if (categoryId !== 'all' && e.categoryId !== categoryId) return false;
    if (!needle) return true;
    const vendorName = vendors.find((v) => v.id === e.vendorId)?.name.toLowerCase() ?? '';
    return [e.title, e.note, e.paidByName, e.categoryId, vendorName].some((field) =>
      (field ?? '').toLowerCase().includes(needle)
    );
  });
}

/** Groups expenses by their date key, keeping input order. Undated ones go under "Earlier". */
export function groupExpensesByDate(expenses: Expense[]): Record<string, Expense[]> {
  const groups: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    (groups[exp.date || 'Earlier'] ??= []).push(exp);
  }
  return groups;
}
