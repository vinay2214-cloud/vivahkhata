import { errorMessage } from '../../lib/errors';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { createGift, updateGift, softDeleteGift } from '../../services/gifts';
import { Gift, Side } from '../../types';

interface GiftSheetProps {
  isOpen: boolean;
  onClose: () => void;
  giftToEdit?: Gift | null;
}

export const GiftSheet: React.FC<GiftSheetProps> = ({ isOpen, onClose, giftToEdit }) => {
  const { t } = useTranslation();
  const { weddingId, wedding, gifts, events, showToast } = useWedding();
  const { user } = useAuth();

  const [giverName, setGiverName] = useState('');
  const [relation, setRelation] = useState('');
  const [town, setTown] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<Side>('common');
  const [eventId, setEventId] = useState('');
  const [cashPaise, setCashPaise] = useState<number>(100000); // Default ₹1,000
  const [showGold, setShowGold] = useState(false);
  const [goldGrams, setGoldGrams] = useState<string>('');
  const [goldDescription, setGoldDescription] = useState('');
  const [items, setItems] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (giftToEdit) {
      setGiverName(giftToEdit.giverName);
      setRelation(giftToEdit.relation || '');
      setTown(giftToEdit.town || '');
      setPhone(giftToEdit.phone || '');
      setSide(giftToEdit.side || 'common');
      setEventId(giftToEdit.eventId || '');
      setCashPaise(giftToEdit.cashPaise || 0);
      if (giftToEdit.goldMg || giftToEdit.items) {
        setShowGold(true);
        setGoldGrams(giftToEdit.goldMg ? (giftToEdit.goldMg / 1000).toString() : '');
        setGoldDescription(giftToEdit.goldDescription || '');
        setItems(giftToEdit.items || '');
      } else {
        setShowGold(false);
        setGoldGrams('');
        setGoldDescription('');
        setItems('');
      }
      setNote(giftToEdit.note || '');
    } else {
      setGiverName('');
      setRelation('');
      setTown('');
      setPhone('');
      setSide('common');
      setEventId(events[0]?.id || '');
      setCashPaise(100000);
      setShowGold(false);
      setGoldGrams('');
      setGoldDescription('');
      setItems('');
      setNote('');
    }
  }, [isOpen, giftToEdit, events]);

  if (!weddingId || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giverName.trim()) return;

    setLoading(true);
    try {
      const highestEnv = gifts.reduce((max, g) => Math.max(max, g.envelopeNo || 0), 0);
      const envelopeNo = giftToEdit?.envelopeNo || highestEnv + 1;
      const goldMg = goldGrams ? Math.round(parseFloat(goldGrams) * 1000) : 0;

      const input = {
        envelopeNo,
        giverName,
        relation,
        town,
        phone,
        side,
        eventId,
        cashPaise,
        goldMg,
        goldDescription,
        items,
        note,
        source: 'manual' as const,
      };

      if (giftToEdit) {
        await updateGift(weddingId, giftToEdit.id, input, user.uid);
        showToast('Gift entry updated');
      } else {
        await createGift(weddingId, input, user.uid);
        showToast(`Gift from ${giverName} saved`, undefined, 'Undo');
      }
      onClose();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save gift'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!giftToEdit) return;
    if (window.confirm('Delete this gift entry?')) {
      try {
        await softDeleteGift(weddingId, giftToEdit.id, user.uid);
        showToast('Gift deleted', undefined, 'Undo');
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
      title={giftToEdit ? 'Edit Gift Record' : 'Record Gift (చదివింపులు)'}
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4 pb-6">
        {/* Cash Amount */}
        <AmountInput
          valuePaise={cashPaise}
          onChangePaise={setCashPaise}
          label="Gift Cash Amount"
          autoFocus={!giftToEdit}
        />

        {/* Giver Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('gift_desk.giver_name')} *
          </label>
          <input
            type="text"
            required
            value={giverName}
            onChange={(e) => setGiverName(e.target.value)}
            placeholder={t('gift_desk.giver_name_placeholder')}
            className="w-full px-3.5 py-2.5 text-base font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Town & Relation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('gift_desk.town')}
            </label>
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder="e.g. Vijayawada"
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {t('gift_desk.relation')}
            </label>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="e.g. Uncle / Colleague"
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Side & Event */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Side
            </label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as Side)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="common">Common (ఉభయులు)</option>
              <option value="bride">{wedding?.sides?.bride?.label || 'Bride Side'}</option>
              <option value="groom">{wedding?.sides?.groom?.label || 'Groom Side'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">General</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gold & Items Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowGold(!showGold)}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer select-none"
          >
            {showGold ? '- Hide Gold & Items' : '+ Add Gold / Silver / Gift Item'}
          </button>

          {showGold && (
            <div className="mt-2.5 p-3.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Gold (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goldGrams}
                    onChange={(e) => setGoldGrams(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    Gold Description
                  </label>
                  <input
                    type="text"
                    value={goldDescription}
                    onChange={(e) => setGoldDescription(e.target.value)}
                    placeholder="Ring / Chain"
                    className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                  Other Gift Items
                </label>
                <input
                  type="text"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  placeholder="e.g. Silver plate, Dinner set"
                  className="w-full mt-1 px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3">
          {giftToEdit && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              aria-label="Delete Gift"
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
            disabled={!giverName.trim()}
          >
            Save Gift
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
