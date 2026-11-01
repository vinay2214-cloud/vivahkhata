import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { AmountText } from '../ui/AmountText';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/dates';
import type { DueItem } from '../../domain/dues';

interface UpcomingDuesProps {
  dues: DueItem[];
  onNavigateTab: (tab: 'money') => void;
}

/** The next few vendor instalments that are overdue or coming up. */
export const UpcomingDues: React.FC<UpcomingDuesProps> = ({
  dues: nextUpcomingDues,
  onNavigateTab,
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-warning)]" />
          <h2 className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">
            {t('dashboard.upcoming_dues')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('money')}
          className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
        >
          {t('dashboard.see_all')}
        </button>
      </div>

      {nextUpcomingDues.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] py-2">{t('dashboard.no_dues')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {nextUpcomingDues.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--color-text)]">
                    {item.vendorName}
                  </span>
                  {item.status === 'overdue' && (
                    <Badge variant="danger" size="sm">
                      Overdue
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                  {item.label} {item.dueDate && `• Due: ${formatDate(item.dueDate)}`}
                </span>
              </div>

              <AmountText
                paise={item.amountPaise}
                className="font-bold text-base text-[var(--color-text)]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
