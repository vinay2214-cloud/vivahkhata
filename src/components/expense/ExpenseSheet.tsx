import { logger } from '../../lib/logger';
import { errorMessage } from '../../lib/errors';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Camera, Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { ChipGroup } from '../ui/ChipGroup';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { createExpense, updateExpense, softDeleteExpense } from '../../services/expenses';
import { compressAndSaveAttachment } from '../../services/attachments';
import { Expense, PaymentMode, PaymentType, Side } from '../../types';
import { getTodayDateString } from '../../lib/dates';

interface ExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  defaultVendorId?: string;
  defaultScheduleItemId?: string;
  defaultAmountPaise?: number;
  defaultCategoryId?: string;
  defaultType?: PaymentType;
}

export const ExpenseSheet: React.FC<ExpenseSheetProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  defaultVendorId,
  defaultScheduleItemId,
  defaultAmountPaise,
  defaultCategoryId,
  defaultType,
}) => {
  const { t } = useTranslation();
  const { weddingId, wedding, members, vendors, events, showToast } = useWedding();
  const { user, profile } = useAuth();

  const [amountPaise, setAmountPaise] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('catering');
  const [paidByUid, setPaidByUid] = useState<string>('');
  const [paidByName, setPaidByName] = useState<string>('');
  const [isSomeoneElse, setIsSomeoneElse] = useState<boolean>(false);
  const [mode, setMode] = useState<PaymentMode>('upi');
  const [type, setType] = useState<PaymentType>('advance');
  const [eventId, setEventId] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [scheduleItemId, setScheduleItemId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [side, setSide] = useState<Side>('common');
  const [note, setNote] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize or reset form values
  useEffect(() => {
    if (expenseToEdit) {
      setAmountPaise(expenseToEdit.amountPaise);
      setCategoryId(expenseToEdit.categoryId);
      setPaidByUid(expenseToEdit.paidByUid || '');
      setPaidByName(expenseToEdit.paidByName);
      setIsSomeoneElse(!expenseToEdit.paidByUid);
      setMode(expenseToEdit.mode);
      setType(expenseToEdit.type);
      setEventId(expenseToEdit.eventId || '');
      setVendorId(expenseToEdit.vendorId || '');
      setScheduleItemId(expenseToEdit.scheduleItemId || '');
      setDate(expenseToEdit.date || getTodayDateString());
      setSide(expenseToEdit.side || 'common');
      setNote(expenseToEdit.note || '');
      setAttachmentIds(expenseToEdit.attachmentIds || []);
    } else {
      setAmountPaise(defaultAmountPaise || 0);
      setCategoryId(defaultCategoryId || 'catering');
      setPaidByUid(user?.uid || '');
      setPaidByName(profile?.displayName || user?.displayName || 'Me');
      setIsSomeoneElse(false);
      setMode('upi');
      setType(defaultType || 'full');
      setEventId('');
      setVendorId(defaultVendorId || '');
      setScheduleItemId(defaultScheduleItemId || '');
      setDate(getTodayDateString());
      setSide('common');
      setNote('');
      setPhotos([]);
      setAttachmentIds([]);
    }
  }, [
    isOpen,
    expenseToEdit,
    defaultVendorId,
    defaultScheduleItemId,
    defaultAmountPaise,
    defaultCategoryId,
    defaultType,
    user,
    profile,
  ]);

  if (!weddingId || !user) return null;

  const categories = wedding?.categories || [];

  const modeOptions = [
    { id: 'upi', label: 'UPI / PhonePe' },
    { id: 'cash', label: 'Cash (నగదు)' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank Transfer' },
    { id: 'cheque', label: 'Cheque' },
  ];

  const typeOptions = [
    { id: 'full', label: 'Full Payment' },
    { id: 'advance', label: 'Advance' },
    { id: 'balance', label: 'Balance' },
  ];

  const sideOptions = [
    { id: 'common', label: 'Common (ఉభయులు)' },
    { id: 'bride', label: wedding?.sides?.bride?.label || 'Bride Side' },
    { id: 'groom', label: wedding?.sides?.groom?.label || 'Groom Side' },
  ];

  const handlePayerSelect = (memberUid: string, memberName: string) => {
    setIsSomeoneElse(false);
    setPaidByUid(memberUid);
    setPaidByName(memberName);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).slice(0, 5);
      setPhotos((prev) => [...prev, ...selected].slice(0, 5));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaise <= 0) return;

    setLoading(true);
    try {
      // If new photos were attached, compress and save them first
      const newAttachmentIds = [...attachmentIds];
      for (const file of photos) {
        const attId = await compressAndSaveAttachment(
          weddingId,
          file,
          'expense',
          expenseToEdit ? expenseToEdit.id : 'temp',
          user.uid
        );
        if (attId) newAttachmentIds.push(attId);
      }

      const input = {
        amountPaise,
        categoryId,
        eventId,
        vendorId,
        scheduleItemId,
        paidByUid: isSomeoneElse ? '' : paidByUid,
        paidByName: isSomeoneElse ? paidByName.trim() || 'Someone else' : paidByName,
        mode,
        type,
        date,
        side,
        note,
        attachmentIds: newAttachmentIds,
      };

      if (expenseToEdit) {
        await updateExpense(weddingId, expenseToEdit.id, input, user.uid);
        showToast('Expense updated successfully');
      } else {
        await createExpense(weddingId, input, user.uid);
        showToast('Expense saved to family ledger', undefined, 'Undo');
      }
      onClose();
    } catch (err) {
      logger.error('Expense save failed', err);
      showToast(errorMessage(err, 'Failed to save expense'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToEdit) return;
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await softDeleteExpense(weddingId, expenseToEdit.id, user.uid);
        showToast('Expense removed', undefined, 'Undo');
        onClose();
      } catch (err) {
        showToast(errorMessage(err, 'Failed to delete'));
      }
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? t('expense_sheet.title_edit') : t('expense_sheet.title_add')}
    >
      <form onSubmit={handleSave} className="flex flex-col gap-5 pb-6">
        {/* Amount Input */}
        <AmountInput
          valuePaise={amountPaise}
          onChangePaise={setAmountPaise}
          label={t('expense_sheet.amount')}
          autoFocus={!expenseToEdit}
        />

        {/* Categories */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.category')}
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid By */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.paid_by')}
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {members.map((m) => {
              const isSelected = !isSomeoneElse && paidByUid === m.uid;
              return (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => handlePayerSelect(m.uid, m.displayName)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)] font-semibold'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  <span>{m.displayName}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsSomeoneElse(true);
                setPaidByUid('');
                setPaidByName('');
              }}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                isSomeoneElse
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)] font-semibold'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}
            >
              + {t('expense_sheet.paid_by_other')}
            </button>
          </div>

          {isSomeoneElse && (
            <input
              type="text"
              value={paidByName}
              onChange={(e) => setPaidByName(e.target.value)}
              placeholder={t('expense_sheet.payer_name_placeholder')}
              className="mt-2 w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          )}
        </div>

        {/* Payment Mode */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.mode')}
          </label>
          <ChipGroup
            options={modeOptions}
            selectedId={mode}
            onChange={(id) => setMode(id as PaymentMode)}
          />
        </div>

        {/* Payment Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.type')}
          </label>
          <ChipGroup
            options={typeOptions}
            selectedId={type}
            onChange={(id) => setType(id as PaymentType)}
          />
        </div>

        {/* Vendor Selection (Optional) */}
        {vendors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('expense_sheet.vendor')}
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">None (వ్యక్తిగత ఖర్చు / దుకాణం)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ceremony / Event Selection (Optional) */}
        {events.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('expense_sheet.event')}
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">General / All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date & Side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('expense_sheet.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('expense_sheet.side')}
            </label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as Side)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            >
              {sideOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.note')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('expense_sheet.note_placeholder')}
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Receipt Photos */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('expense_sheet.photos')}
          </label>
          <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] cursor-pointer transition-colors bg-[var(--color-surface)]">
            <Camera className="w-5 h-5 text-[var(--color-primary)]" />
            <span>Upload Receipt / Bill Photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {(photos.length > 0 || attachmentIds.length > 0) && (
            <p className="text-xs text-[var(--color-success)] font-medium">
              ✓ {photos.length + attachmentIds.length} receipt photo(s) attached
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          {expenseToEdit && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              icon={<Trash2 className="w-5 h-5" />}
              aria-label="Delete"
            >
              Delete
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={amountPaise <= 0}
          >
            {t('expense_sheet.save')}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
