import React from 'react';
import { useTranslation } from 'react-i18next';
import { AmountText } from '../ui/AmountText';

interface SpendBreakdownProps {
  categoriesWithSpend: { id: string; label: string; spentPaise: number }[];
  payers: { name: string; amount: number }[];
  totalSpentPaise: number;
}

/** Top spending categories and who has paid how much. */
export const SpendBreakdown: React.FC<SpendBreakdownProps> = ({
  categoriesWithSpend,
  payers,
  totalSpentPaise,
}) => {
  const { t } = useTranslation();
  const totals = { totalSpentPaise };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Spend by Category */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
        <h2 className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider mb-4">
          {t('dashboard.spend_by_category')}
        </h2>

        {categoriesWithSpend.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
            No categorized expenses yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {categoriesWithSpend.map((cat) => {
              const ratio =
                totals.totalSpentPaise > 0 ? (cat.spentPaise / totals.totalSpentPaise) * 100 : 0;
              return (
                <div key={cat.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-text)]">{cat.label}</span>
                    <AmountText paise={cat.spentPaise} />
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spend by Payer */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
        <h2 className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider mb-4">
          {t('dashboard.spend_by_payer')}
        </h2>

        {payers.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
            No payments recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {payers.map((payer, idx) => {
              const ratio =
                totals.totalSpentPaise > 0 ? (payer.amount / totals.totalSpentPaise) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-text)]">{payer.name}</span>
                    <AmountText paise={payer.amount} />
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
