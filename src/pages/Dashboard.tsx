import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IndianRupee, Gift, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { seedDemoWedding } from '../services/demoData';
import { StatCard } from '../components/ui/StatCard';
import { formatDate, formatCountdown } from '../lib/dates';
import { pendingDues } from '../domain/dues';
import { GettingStartedCard } from '../components/dashboard/GettingStartedCard';
import { UpcomingDues } from '../components/dashboard/UpcomingDues';
import { SpendBreakdown } from '../components/dashboard/SpendBreakdown';
import { SettleUpCard } from '../components/dashboard/SettleUpCard';
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
  onOpenVendorModal,
  onOpenInviteModal,
}) => {
  const { t } = useTranslation();
  const { weddingId, wedding, totals, expenses, vendors, gifts, events, members, showToast } =
    useWedding();
  const { user } = useAuth();
  const [loadingSample, setLoadingSample] = useState(false);
  const showSampleBanner =
    Boolean(user?.isAnonymous) &&
    expenses.length === 0 &&
    gifts.length === 0 &&
    vendors.length === 0;

  const loadSample = async () => {
    if (!weddingId || !user || loadingSample) return;
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

  const allDueItems = pendingDues(vendors, expenses);
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
              Fill this wedding with a realistic sample — vendors, dues, expenses and gift envelopes
              — in one tap.
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

      {showGettingStarted && (
        <GettingStartedCard
          isInviteDone={isInviteDone}
          isExpenseDone={isExpenseDone}
          isVendorDone={isVendorDone}
          onOpenInviteModal={onOpenInviteModal}
          onOpenExpenseSheet={onOpenExpenseSheet}
          onOpenVendorModal={onOpenVendorModal}
        />
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
            <h3 className="font-bold text-base">{t('dashboard.open_gift_desk')}</h3>
            <p className="text-xs text-white/80 mt-0.5">
              High-speed, large-keypad entry for volunteers at the venue table
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 shrink-0" />
      </div>

      <UpcomingDues dues={nextUpcomingDues} onNavigateTab={onNavigateTab} />

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
              <h3 className="font-bold text-base text-[var(--color-text)]">{nextEvent.name}</h3>
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

      <SpendBreakdown
        categoriesWithSpend={categoriesWithSpend}
        payers={payers}
        totalSpentPaise={totals.totalSpentPaise}
      />

      {settle.balances.length > 1 && <SettleUpCard settle={settle} />}
    </div>
  );
};
