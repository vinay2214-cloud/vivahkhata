import React, { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { AmountText } from '../../components/ui/AmountText';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { errorMessage } from '../../lib/errors';
import { toPaise } from '../../lib/money';
import { updateWedding } from '../../services/weddings';

/** Total budget summary plus editable per-category budget targets. */
export const BudgetTab: React.FC = () => {
  const { weddingId, wedding, totals, showToast } = useWedding();
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetRupees, setEditingBudgetRupees] = useState('');
  const categories = wedding?.categories || [];

  const handleSaveCategoryBudget = async (categoryId: string) => {
    if (!weddingId) return;
    const categoryBudgets = {
      ...(wedding?.categoryBudgets || {}),
      [categoryId]: toPaise(parseFloat(editingBudgetRupees) || 0),
    };
    try {
      await updateWedding(weddingId, { categoryBudgets });
      showToast('Category budget target updated');
      setEditingBudgetId(null);
    } catch (err) {
      showToast(errorMessage(err, 'Failed to update budget'));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Total Budget Card */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Total Planned Budget
            </span>
            <AmountText
              paise={totals.totalPlannedBudgetPaise}
              className="text-2xl font-bold text-[var(--color-primary)]"
            />
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Remaining
            </span>
            <AmountText
              paise={totals.remainingBudgetPaise}
              className="text-xl font-bold text-[var(--color-success)]"
            />
          </div>
        </div>

        <ProgressBar
          value={totals.totalSpentPaise}
          max={totals.totalPlannedBudgetPaise}
          showLabels
        />
      </div>

      {/* Per Category Planned vs Spent Rows */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">
          Category Budgets & Spending
        </h3>

        <div className="flex flex-col gap-4 divide-y divide-[var(--color-border)]">
          {categories.map((cat) => {
            const spent = totals.spentByCategoryPaise[cat.id] || 0;
            const planned = wedding?.categoryBudgets?.[cat.id] || 0;
            const isOver = planned > 0 && spent > planned;

            return (
              <div key={cat.id} className="pt-3.5 first:pt-0 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-sm font-bold text-[var(--color-text)]">{cat.label}</span>

                  {editingBudgetId === cat.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        autoFocus
                        value={editingBudgetRupees}
                        onChange={(e) => setEditingBudgetRupees(e.target.value)}
                        className="w-24 px-2 py-1 text-xs border rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCategoryBudget(cat.id)}
                        className="px-2 py-1 bg-[var(--color-primary)] text-white text-xs rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-text-muted)]">
                        Planned:{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBudgetId(cat.id);
                            setEditingBudgetRupees((planned / 100).toString());
                          }}
                          className="underline hover:text-[var(--color-primary)] cursor-pointer"
                        >
                          <AmountText paise={planned} />
                        </button>
                      </span>
                      <span>•</span>
                      <span className={isOver ? 'text-[var(--color-danger)] font-bold' : ''}>
                        Spent: <AmountText paise={spent} />
                      </span>
                    </div>
                  )}
                </div>

                <ProgressBar value={spent} max={planned > 0 ? planned : spent} />

                {isOver && (
                  <p className="text-[11px] text-[var(--color-danger)] font-semibold text-right">
                    ⚠ Over budget by <AmountText paise={spent - planned} />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
