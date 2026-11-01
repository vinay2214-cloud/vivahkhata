import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IndianRupee,
  Gift,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { seedDemoWedding } from '../services/demoData';
import { StatCard } from '../components/ui/StatCard';
import { AmountText } from '../components/ui/AmountText';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatDate, formatCountdown } from '../lib/dates';
import { computeVendorBalance } from '../domain/vendorBalance';
import { settleUp } from '../domain/settle';

interface DashboardProps {
  onNavigateTab: (tab: 'home' | 'money' | 'gifts' | 'more' | 'gift-desk') => void;
  onOpenExpenseSheet: () => void;
  onOpenGiftSheet: () => void;
  onOpenVendorModal: () => void;
  onOpenInviteModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  onOpenExpenseSheet,
  onOpenGiftSheet,
  onOpenVendorModal,
  onOpenInviteModal,
}) => {
  const { t } = useTranslation();
  const { weddingId, wedding, totals, expenses, vendors, gifts, events, members, showToast } = useWedding();
  const { user } = useAuth();
  const [loadingSample, setLoadingSample] = useState(false);
  const showSampleBanner = Boolean(user?.isAnonymous) && expenses.length === 0 && gifts.length === 0 && vendors.length === 0;

  const loadSample = async () => {
    if (!weddingId || !user) return;
    setLoadingSample(true);
    try {
      await seedDemoWedding(weddingId, user.uid);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load the sample wedding');
    } finally {
      setLoadingSample(false);
    }
  };

  const countdown = formatCountdown(wedding?.weddingDate);

  // Compute upcoming dues from vendors
  const allDueItems: Array<{
    vendorName: string;
    label: string;
    amountPaise: number;
    dueDate: string;
    status: 'paid' | 'due' | 'overdue';
  }> = [];

  vendors.forEach((v) => {
    const summary = computeVendorBalance(v, expenses);
    summary.scheduleWithStatus.forEach((item) => {
      if (item.status !== 'paid') {
        allDueItems.push({
          vendorName: v.name,
          label: item.label,
          amountPaise: item.amountPaise,
          dueDate: item.dueDate,
          status: item.status,
        });
      }
    });
  });

  // Sort: overdue first, then by earliest dueDate
  allDueItems.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  const nextUpcomingDues = allDueItems.slice(0, 3);

  // Next Event
  const nextEvent = events[0];

  // Checklist for getting started
  const isInviteDone = members.length > 1;
  const isExpenseDone = expenses.length > 0;
  const isVendorDone = vendors.length > 0;
  const showGettingStarted = !(isInviteDone && isExpenseDone && isVendorDone);

  // Categories with expenses
  const categoriesWithSpend = (wedding?.categories || [])
    .map((cat) => ({
      ...cat,
      spentPaise: totals.spentByCategoryPaise[cat.id] || 0,
    }))
    .filter((c) => c.spentPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise)
    .slice(0, 6);

  const settle = settleUp(totals.spentByPayerPaise);

  // Top payers
  const payers = Object.entries(totals.spentByPayerPaise)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {showSampleBanner && (
        <div className="p-4 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-[var(--color-primary)]">Exploring in Demo Mode</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Fill this wedding with a realistic sample — vendors, dues, expenses and gift envelopes — in one tap.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSample}
            disabled={loadingSample}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm min-h-12 cursor-pointer disabled:opacity-60"
          >
            {loadingSample ? 'Loading sample…' : 'Load sample wedding'}
          </button>
        </div>
      )}
      {/* Wedding Header & Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-wedding text-[var(--color-primary)]">
              {wedding?.title || 'Vivah Khata'}
            </h1>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
            <span>{formatDate(wedding?.weddingDate)}</span>
            <span>•</span>
            <span>{wedding?.city}</span>
          </p>
        </div>

        {countdown && (
          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-[var(--color-accent-soft)] text-[#8C5D00] border border-[#F2B84B]/40">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>{countdown}</span>
            </span>
          </div>
        )}
      </div>

      {/* Getting Started Checklist Card */}
      {showGettingStarted && (
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
      )}

      {/* 2x2 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Planned Budget */}
        <StatCard
          label={t('dashboard.total_budget')}
          paise={totals.totalPlannedBudgetPaise}
          variant="primary"
          icon={<IndianRupee className="w-4 h-4" />}
          subText={
            totals.totalPlannedBudgetPaise > 0
              ? `${(totals.remainingBudgetPaise / 100).toLocaleString('en-IN')} remaining`
              : 'Set in settings'
          }
          onClick={() => onNavigateTab('money')}
        />

        {/* Total Spent */}
        <StatCard
          label={t('dashboard.spent')}
          paise={totals.totalSpentPaise}
          variant="default"
          icon={<IndianRupee className="w-4 h-4" />}
          progress={
            totals.totalPlannedBudgetPaise > 0
              ? {
                  current: totals.totalSpentPaise,
                  total: totals.totalPlannedBudgetPaise,
                }
              : undefined
          }
          subText={`${expenses.length} expenses logged`}
          onClick={() => onNavigateTab('money')}
        />

        {/* Still to Pay (Vendor Dues) */}
        <StatCard
          label={t('dashboard.still_to_pay')}
          paise={totals.pendingDuesPaise}
          variant="warning"
          icon={<Clock className="w-4 h-4 text-[var(--color-warning)]" />}
          subText={`${allDueItems.length} pending installments`}
          onClick={() => onNavigateTab('money')}
        />

        {/* Gifts Received */}
        <StatCard
          label={t('dashboard.gifts_received')}
          paise={totals.totalGiftsCashPaise}
          variant="accent"
          icon={<Gift className="w-4 h-4 text-[var(--color-accent)]" />}
          subText={t('dashboard.gifts_count', { count: totals.totalGiftsCount })}
          onClick={() => onNavigateTab('gifts')}
        />
      </div>

      {/* Gift Desk Banner Button */}
      <div
        onClick={() => onNavigateTab('gift-desk')}
        className="p-4 rounded-2xl bg-gradient-to-r from-[#9B1C31] to-[#D99A1E] text-white shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">
              {t('dashboard.open_gift_desk')}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              High-speed, large-keypad entry for volunteers at the venue table
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 shrink-0" />
      </div>

      {/* Upcoming Vendor Dues */}
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
          <p className="text-xs text-[var(--color-text-muted)] py-2">
            {t('dashboard.no_dues')}
          </p>
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

      {/* Next Event Card */}
      {nextEvent && (
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider block">
                {t('dashboard.next_event')}
              </span>
              <h3 className="font-bold text-base text-[var(--color-text)]">
                {nextEvent.name}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                {nextEvent.date && <span>{formatDate(nextEvent.date)}</span>}
                {nextEvent.venue && <span>• {nextEvent.venue}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('more')}
            className="text-xs font-bold text-[var(--color-primary)] hover:underline shrink-0 cursor-pointer"
          >
            All events
          </button>
        </div>
      )}

      {/* Spend Breakdowns */}
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
                const ratio = totals.totalSpentPaise > 0 ? (cat.spentPaise / totals.totalSpentPaise) * 100 : 0;
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
                const ratio = totals.totalSpentPaise > 0 ? (payer.amount / totals.totalSpentPaise) * 100 : 0;
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

      {/* Settle up — who owes whom if everyone who paid shares equally */}
      {settle.balances.length > 1 && (
        <section className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs" aria-labelledby="settle-title">
          <h2 id="settle-title" className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">
            Settle up
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">
            If the {settle.balances.length} people who paid share equally, each share is{' '}
            <AmountText paise={settle.sharePaise} className="font-bold" />.
          </p>
          {settle.transfers.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--color-success)]">Everyone is even. Nothing to settle.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {settle.transfers.map((tr) => (
                <li key={`${tr.from}-${tr.to}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] text-sm">
                  <span className="font-semibold text-[var(--color-text)] min-w-0 truncate">
                    {tr.from} <ArrowRight className="inline w-3.5 h-3.5 mx-1 text-[var(--color-text-muted)]" aria-label="pays" /> {tr.to}
                  </span>
                  <AmountText paise={tr.amountPaise} className="font-bold text-[var(--color-primary)] shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
