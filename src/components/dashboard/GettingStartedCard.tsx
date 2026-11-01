import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface GettingStartedCardProps {
  isInviteDone: boolean;
  isExpenseDone: boolean;
  isVendorDone: boolean;
  onOpenInviteModal: () => void;
  onOpenExpenseSheet: () => void;
  onOpenVendorModal: () => void;
}

/** Three-step checklist shown until the family has invited someone, added an expense and a vendor. */
export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  isInviteDone,
  isExpenseDone,
  isVendorDone,
  onOpenInviteModal,
  onOpenExpenseSheet,
  onOpenVendorModal,
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-primary-soft)]/50 border border-[var(--color-primary)]/20 shadow-xs">
      <h2 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
        {t('dashboard.get_started')}
      </h2>

      <div className="flex flex-col gap-2">
        {/* Task 1: Invite */}
        <div
          onClick={onOpenInviteModal}
          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            isInviteDone
              ? 'bg-white/80 border-neutral-200 line-through text-neutral-400'
              : 'bg-white border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2
              className={`w-4 h-4 ${
                isInviteDone ? 'text-[var(--color-success)]' : 'text-neutral-300'
              }`}
            />
            <span>{t('dashboard.task_invite')}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-primary)]" />
        </div>

        {/* Task 2: First expense */}
        <div
          onClick={onOpenExpenseSheet}
          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            isExpenseDone
              ? 'bg-white/80 border-neutral-200 line-through text-neutral-400'
              : 'bg-white border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2
              className={`w-4 h-4 ${
                isExpenseDone ? 'text-[var(--color-success)]' : 'text-neutral-300'
              }`}
            />
            <span>{t('dashboard.task_expense')}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-primary)]" />
        </div>

        {/* Task 3: Vendor */}
        <div
          onClick={onOpenVendorModal}
          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            isVendorDone
              ? 'bg-white/80 border-neutral-200 line-through text-neutral-400'
              : 'bg-white border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2
              className={`w-4 h-4 ${
                isVendorDone ? 'text-[var(--color-success)]' : 'text-neutral-300'
              }`}
            />
            <span>{t('dashboard.task_vendor')}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>
    </div>
  );
};
