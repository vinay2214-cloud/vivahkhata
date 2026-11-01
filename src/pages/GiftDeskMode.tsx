import { errorMessage } from '../lib/errors';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Gift as GiftIcon, Check, AlertTriangle } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { SyncPill } from '../components/ui/SyncPill';
import { AmountText } from '../components/ui/AmountText';
import { createGift, generateNameKey } from '../services/gifts';
import { toPaise } from '../lib/money';
import { Side } from '../types';

interface GiftDeskModeProps {
  onExit: () => void;
}

export const GiftDeskMode: React.FC<GiftDeskModeProps> = ({ onExit }) => {
  const { t } = useTranslation();
  const { weddingId, gifts, events, showToast } = useWedding();
  const { user } = useAuth();
  const { isOnline, isSyncing, pendingWrites } = useSyncStatus();

  // Form Fields
  const [envelopeNo, setEnvelopeNo] = useState<number>(1);
  const [giverName, setGiverName] = useState<string>('');
  const [town, setTown] = useState<string>('');
  const [relation, setRelation] = useState<string>('');
  const [amountRupees, setAmountRupees] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [side] = useState<Side>('common');
  const [showGold, setShowGold] = useState(false);
  const [goldGrams, setGoldGrams] = useState<string>('');
  const [goldDesc, setGoldDesc] = useState<string>('');
  const [items, setItems] = useState<string>('');

  // UI Feedback
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Exit Long-Press
  const [exitProgress, setExitProgress] = useState(0);
  const exitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Focus reference for quick continuous entry
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Set default event and envelope number on load
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Next envelope number follows the highest one already recorded
  useEffect(() => {
    const maxEnv = gifts.reduce((max, g) => Math.max(max, g.envelopeNo || 0), 0);
    setEnvelopeNo(maxEnv + 1);
  }, [gifts]);

  // Session Totals (made during this active desk session)
  const sessionGifts = gifts.filter((g) => g.source === 'giftDesk' || g.createdBy === user?.uid);
  const sessionTotalPaise = sessionGifts.reduce((sum, g) => sum + g.cashPaise, 0);

  // Last 5 entries
  const last5Entries = gifts.slice(0, 5);

  // Duplicate check on typing giver name
  useEffect(() => {
    if (giverName.trim().length >= 3) {
      const key = generateNameKey(giverName);
      const match = gifts.find(
        (g) =>
          g.nameKey === key && (!town.trim() || g.town?.toLowerCase() === town.toLowerCase().trim())
      );
      if (match) {
        setDuplicateWarning(
          `Notice: ${match.giverName} (${match.town || 'Same town'}) gave ₹${(match.cashPaise / 100).toLocaleString('en-IN')}`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [giverName, town, gifts]);

  // A gift needs cash, gold or an item — never save an envelope with nothing recorded.
  const hasGiftValue =
    (parseInt(amountRupees.replace(/[^0-9]/g, ''), 10) || 0) > 0 ||
    (parseFloat(goldGrams) || 0) > 0 ||
    items.trim().length > 0;

  const handleSaveAndNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!giverName.trim() || !weddingId || !user) return;
    if (!hasGiftValue) return;

    setLoading(true);
    try {
      const parsedRupees = parseInt(amountRupees.replace(/[^0-9]/g, ''), 10) || 0;
      const parsedGoldMg = goldGrams ? Math.round(parseFloat(goldGrams) * 1000) : 0;

      await createGift(
        weddingId,
        {
          envelopeNo,
          giverName: giverName.trim(),
          town: town.trim(),
          relation: relation.trim(),
          side,
          eventId: selectedEventId,
          cashPaise: toPaise(parsedRupees),
          goldMg: parsedGoldMg,
          goldDescription: goldDesc.trim(),
          items: items.trim(),
          source: 'giftDesk',
        },
        user.uid
      );

      // Trigger tactile haptic vibration where supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {
          // Vibration is a nicety; ignore browsers that block it.
        }
      }

      // Visual flash
      setFlashSuccess(true);
      setTimeout(() => setFlashSuccess(false), 300);

      // Increment Envelope Number and Reset Inputs for NEXT guest
      setEnvelopeNo((prev) => prev + 1);
      setGiverName('');
      setTown('');
      setRelation('');
      setAmountRupees('');
      setShowGold(false);
      setGoldGrams('');
      setGoldDesc('');
      setItems('');
      setDuplicateWarning(null);

      // Refocus Giver Name input for next 5-second entry
      nameInputRef.current?.focus();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save gift'));
    } finally {
      setLoading(false);
    }
  };

  // Exit Long Press Handler
  const startExitPress = () => {
    setExitProgress(0);
    const start = Date.now();
    exitTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / 1000) * 100, 100);
      setExitProgress(progress);
      if (progress >= 100) {
        if (exitTimerRef.current) clearInterval(exitTimerRef.current);
        onExit();
      }
    }, 50);
  };

  const cancelExitPress = () => {
    if (exitTimerRef.current) {
      if (exitTimerRef.current) clearInterval(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setExitProgress(0);
  };

  return (
    <div
      className={`min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-3 sm:p-5 max-w-xl mx-auto transition-colors duration-200 ${
        flashSuccess ? 'bg-emerald-100' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] pb-3">
        {/* Exit Long-Press Button */}
        <button
          type="button"
          onMouseDown={startExitPress}
          onMouseUp={cancelExitPress}
          onTouchStart={startExitPress}
          onTouchEnd={cancelExitPress}
          className="relative px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5 cursor-pointer select-none overflow-hidden"
        >
          {exitProgress > 0 && (
            <div
              className="absolute inset-0 bg-[var(--color-primary)] opacity-30"
              style={{ width: `${exitProgress}%` }}
            />
          )}
          <ArrowLeft className="w-4 h-4" />
          <span>Hold to Exit</span>
        </button>

        {/* Sync Pill */}
        <SyncPill isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingWrites} />
      </div>

      {/* Session Counter Strip */}
      <div className="py-2.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs flex items-center justify-between text-xs sm:text-sm font-bold">
        <div className="flex items-center gap-2 text-[var(--color-primary)]">
          <GiftIcon className="w-4 h-4" />
          <span>Today: {sessionGifts.length} gifts</span>
        </div>
        <div>
          Total:{' '}
          <AmountText paise={sessionTotalPaise} className="text-base text-[var(--color-text)]" />
        </div>
      </div>

      {/* Main Form for Lightning Speed Entry */}
      <form onSubmit={handleSaveAndNext} className="my-auto py-3 flex flex-col gap-3.5">
        {/* Envelope # & Event */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('gift_desk.envelope_no')}
            </label>
            <input
              type="number"
              value={envelopeNo}
              onChange={(e) => setEnvelopeNo(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-lg font-bold tabular-nums bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Event / Ceremony
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Giver Name (Huge 20px font) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('gift_desk.giver_name')} *
          </label>
          <input
            ref={nameInputRef}
            type="text"
            required
            autoFocus
            value={giverName}
            onChange={(e) => setGiverName(e.target.value)}
            placeholder={t('gift_desk.giver_name_placeholder')}
            className="w-full px-4 py-3.5 text-xl font-bold bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-xl shadow-xs focus:outline-none"
          />
        </div>

        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* Town / Village & Relation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('gift_desk.town')}
            </label>
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder={t('gift_desk.town_placeholder')}
              className="w-full px-3 py-2.5 text-base bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('gift_desk.relation')}
            </label>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder={t('gift_desk.relation_placeholder')}
              className="w-full px-3 py-2.5 text-base bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
            />
          </div>
        </div>

        {/* Cash Amount Keypad Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('gift_desk.amount')}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-2xl font-bold text-[var(--color-primary)] select-none">
              ₹
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amountRupees ? Number(amountRupees).toLocaleString('en-IN') : ''}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9]/g, '');
                setAmountRupees(clean);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAndNext();
                }
              }}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 text-2xl font-bold tabular-nums bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Quick Cash Amount Chips */}
          <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
            {[500, 1000, 1116, 2000, 5000, 10000].map((amt) => {
              const isSelected = amountRupees === amt.toString();
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountRupees(amt.toString())}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gold & Items Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowGold(!showGold)}
            className="text-xs font-bold text-[var(--color-accent)] hover:underline cursor-pointer select-none"
          >
            {showGold ? '- Hide Gold / Item details' : t('gift_desk.gold_toggle')}
          </button>

          {showGold && (
            <div className="mt-2 p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-semibold block mb-0.5">{t('gift_desk.gold_grams')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={goldGrams}
                  onChange={(e) => setGoldGrams(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-2.5 py-1.5 bg-[var(--color-surface)] border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-0.5">{t('gift_desk.gold_desc')}</label>
                <input
                  type="text"
                  value={goldDesc}
                  onChange={(e) => setGoldDesc(e.target.value)}
                  placeholder="Ring / Chain"
                  className="w-full px-2.5 py-1.5 bg-[var(--color-surface)] border rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* BIG 56px SAVE & NEXT BUTTON */}
        <button
          type="submit"
          disabled={!giverName.trim() || !hasGiftValue || loading}
          className="w-full h-14 rounded-2xl bg-[var(--color-success)] text-white text-lg font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>{t('gift_desk.save_next')}</span>
        </button>
      </form>

      {/* Recent 5 Entries Compact Strip */}
      {last5Entries.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1.5">
            {t('gift_desk.recent_title')}
          </span>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {last5Entries.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-[var(--color-accent)]">#{entry.envelopeNo}</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">
                    {entry.giverName}
                  </span>
                  {entry.town && (
                    <span className="text-[var(--color-text-muted)] truncate">({entry.town})</span>
                  )}
                </div>
                <AmountText
                  paise={entry.cashPaise}
                  className="font-bold text-[var(--color-primary)] shrink-0 ml-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
