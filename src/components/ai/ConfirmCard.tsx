import { errorMessage } from '../../lib/errors';
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { createExpense } from '../../services/expenses';
import { createGift } from '../../services/gifts';
import { PaymentMode, PaymentType, Side } from '../../types';
import { getTodayDateString } from '../../lib/dates';

export interface ParsedAIDraft {
  kind: 'expense' | 'gift' | 'unknown';
  language?: string;
  transcript?: string;
  imageThumbnail?: string;
  expense?: {
    amountRupees: number | null;
    categoryId: string | null;
    vendorName: string | null;
    vendorId: string | null;
    paidByName: string | null;
    paidByUid: string | null;
    mode: PaymentMode | null;
    type: PaymentType | null;
    eventId: string | null;
    date: string | null;
    upiRef: string | null;
    note: string | null;
  } | null;
  gift?: {
    giverName: string | null;
    relation: string | null;
    town: string | null;
    cashRupees: number | null;
    goldGrams: number | null;
    items: string | null;
    eventId: string | null;
  } | null;
  confidence?: Record<string, 'high' | 'medium' | 'low'>;
  warnings?: string[];
  duplicateOf?: string;
}

interface ConfirmCardProps {
  isOpen: boolean;
  onClose: () => void;
  draft: ParsedAIDraft | null;
}

export const ConfirmCard: React.FC<ConfirmCardProps> = ({ isOpen, onClose, draft }) => {
  const { weddingId, wedding, expenses, showToast } = useWedding();
  const { user, profile } = useAuth();

  const [kind, setKind] = useState<'expense' | 'gift'>('expense');
  const [amountPaise, setAmountPaise] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('catering');
  const [vendorId, setVendorId] = useState<string>('');
  const [paidByName, setPaidByName] = useState<string>('');
  const [paidByUid, setPaidByUid] = useState<string>('');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [type, setType] = useState<PaymentType>('advance');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [upiRef, setUpiRef] = useState<string>('');

  // Gift fields
  const [giverName, setGiverName] = useState<string>('');
  const [town, setTown] = useState<string>('');
  const [relation, setRelation] = useState<string>('');
  const [goldGrams, setGoldGrams] = useState<string>('');

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!draft) return;

    if (draft.kind === 'gift') {
      setKind('gift');
      setAmountPaise(Math.round((draft.gift?.cashRupees || 0) * 100));
      setGiverName(draft.gift?.giverName || '');
      setTown(draft.gift?.town || '');
      setRelation(draft.gift?.relation || '');
      setGoldGrams(draft.gift?.goldGrams ? draft.gift.goldGrams.toString() : '');
    } else {
      setKind('expense');
      setAmountPaise(Math.round((draft.expense?.amountRupees || 0) * 100));
      setCategoryId(draft.expense?.categoryId || 'catering');
      setVendorId(draft.expense?.vendorId || '');
      setPaidByName(draft.expense?.paidByName || profile?.displayName || user?.displayName || 'Me');
      setPaidByUid(draft.expense?.paidByUid || user?.uid || '');
      setMode(draft.expense?.mode || 'upi');
      setType(draft.expense?.type || 'full');
      setDate(draft.expense?.date || getTodayDateString());
      setNote(draft.expense?.note || '');
      setUpiRef(draft.expense?.upiRef || '');
    }
  }, [draft, profile, user]);

  if (!draft || !weddingId || !user) return null;

  const categories = wedding?.categories || [];

  const goldMg = goldGrams ? Math.round((parseFloat(goldGrams) || 0) * 1000) : 0;
  const giftHasValue = amountPaise > 0 || goldMg > 0 || !!draft.gift?.items;
  const canSave =
    kind === 'expense' ? amountPaise > 0 : giverName.trim().length > 0 && giftHasValue;

  // Same UPI reference already in the ledger? Warn before saving it twice.
  const cleanUpiRef = upiRef.trim();
  const duplicateExpense =
    kind === 'expense' && cleanUpiRef
      ? expenses.find((x) => !x.deleted && x.upiRef && x.upiRef.trim() === cleanUpiRef)
      : undefined;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    try {
      if (kind === 'expense') {
        const input = {
          amountPaise,
          categoryId,
          vendorId: vendorId || '',
          paidByName: paidByName || 'Me',
          paidByUid: paidByUid || '',
          mode,
          type,
          date,
          side: 'common' as Side,
          note: note ? `${note} (AI transcribed)` : '(AI transcribed)',
          upiRef,
          source: (draft.imageThumbnail ? (upiRef ? 'upi' : 'receipt') : 'voice') as
            'upi' | 'receipt' | 'voice',
        };
        await createExpense(weddingId, input, user.uid);
        showToast('Expense confirmed & saved to ledger', undefined, 'Undo');
      } else {
        const input = {
          giverName: giverName.trim(),
          town,
          relation,
          side: 'common' as Side,
          cashPaise: amountPaise,
          goldMg,
          items: draft.gift?.items || '',
          note: note || '(AI voice entry)',
          source: 'voice' as const,
        };
        await createGift(weddingId, input, user.uid);
        showToast(`Gift from ${giverName.trim()} confirmed & saved`, undefined, 'Undo');
      }
      onClose();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Check and Save (ధృవీకరించండి)">
      <form onSubmit={handleSave} className="flex flex-col gap-4 pb-6">
        {duplicateExpense && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              This payment looks already recorded (same UPI reference, ₹
              {(duplicateExpense.amountPaise / 100).toLocaleString('en-IN')} on{' '}
              {duplicateExpense.date}). Save again only if it is a different payment.
            </p>
          </div>
        )}

        {/* Warning if any duplicate UPI was detected */}
        {draft.warnings && draft.warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {draft.warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* What we heard / saw */}
        {draft.transcript && (
          <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] italic">
            <span className="font-semibold not-italic text-[var(--color-text-muted)] block mb-1">
              What we heard:
            </span>
            "{draft.transcript}"
          </div>
        )}

        {/* Type Switcher: Expense vs Gift */}
        <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setKind('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              kind === 'expense'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            Expense (ఖర్చు)
          </button>
          <button
            type="button"
            onClick={() => setKind('gift')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              kind === 'gift'
                ? 'bg-[var(--color-accent)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            Gift (చదివింపులు)
          </button>
        </div>

        {/* Amount Input */}
        <AmountInput
          valuePaise={amountPaise}
          onChangePaise={setAmountPaise}
          label="Amount in Rupees"
          autoFocus
        />

        {kind === 'expense' ? (
          <>
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payer Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Paid by
              </label>
              <input
                type="text"
                value={paidByName}
                onChange={(e) => setPaidByName(e.target.value)}
                placeholder="Payer name"
                className="w-full px-3.5 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
              />
            </div>

            {/* Mode & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as PaymentMode)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PaymentType)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                >
                  <option value="full">Full</option>
                  <option value="advance">Advance</option>
                  <option value="balance">Balance</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Notes
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notes or vendor remarks"
                className="w-full px-3.5 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
              />
            </div>
          </>
        ) : (
          <>
            {/* Gift Giver Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Giver Name *
              </label>
              <input
                type="text"
                required
                value={giverName}
                onChange={(e) => setGiverName(e.target.value)}
                placeholder="e.g. Ramesh Garu"
                className="w-full px-3.5 py-2 text-sm font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
              />
            </div>

            {/* Town & Relation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Town / Village
                </label>
                <input
                  type="text"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g. Guntur"
                  className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Relation
                </label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Mama / Friend"
                  className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                />
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Discard
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!canSave}
          >
            Save to Ledger ✓
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
