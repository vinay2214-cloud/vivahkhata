import { errorMessage } from '../../lib/errors';
import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import {
  createWeddingEvent,
  updateWeddingEvent,
  softDeleteWeddingEvent,
} from '../../services/events';
import { WeddingEvent, Side } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: WeddingEvent | null;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, eventToEdit }) => {
  const { weddingId, wedding, events, showToast } = useWedding();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<WeddingEvent['type']>('other');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [side, setSide] = useState<Side>('common');
  const [budgetPaise, setBudgetPaise] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name);
      setType(eventToEdit.type);
      setDate(eventToEdit.date || '');
      setStartTime(eventToEdit.startTime || '');
      setVenue(eventToEdit.venue || '');
      setMapUrl(eventToEdit.mapUrl || '');
      setSide(eventToEdit.side || 'common');
      setBudgetPaise(eventToEdit.budgetPaise || 0);
      setNotes(eventToEdit.notes || '');
    } else {
      setName('');
      setType('other');
      setDate(wedding?.weddingDate || '');
      setStartTime('');
      setVenue('');
      setMapUrl('');
      setSide('common');
      setBudgetPaise(0);
      setNotes('');
    }
  }, [isOpen, eventToEdit, wedding]);

  if (!weddingId || !user) return null;

  const eventTypes: Array<{ type: WeddingEvent['type']; label: string }> = [
    { type: 'engagement', label: 'Nischitartham (Engagement)' },
    { type: 'haldi', label: 'Haldi / Pellikoothuru' },
    { type: 'mehendi', label: 'Mehendi / Sangeet' },
    { type: 'wedding', label: 'Muhurtham (Wedding)' },
    { type: 'reception', label: 'Reception' },
    { type: 'vratham', label: 'Satyanarayana Vratham' },
    { type: 'other', label: 'Other Ceremony' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const input = {
        name,
        type,
        date,
        startTime,
        venue,
        mapUrl,
        side,
        budgetPaise,
        notes,
        order: eventToEdit?.order || events.length + 1,
      };

      if (eventToEdit) {
        await updateWeddingEvent(weddingId, eventToEdit.id, input, user.uid);
        showToast('Event updated');
      } else {
        await createWeddingEvent(weddingId, input, user.uid);
        showToast('Event added to wedding schedule');
      }
      onClose();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save event'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;
    if (window.confirm('Delete this event?')) {
      try {
        await softDeleteWeddingEvent(weddingId, eventToEdit.id, user.uid);
        showToast('Event removed');
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
      title={eventToEdit ? 'Edit Event Details' : 'Add Ceremony / Event'}
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4 pb-6">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Ceremony Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pellikoothuru Function"
            className="w-full px-3.5 py-2.5 text-base font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Ceremony Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Ceremony Type
          </label>
          <select
            value={type}
            onChange={(e) => {
              const selected = e.target.value as WeddingEvent['type'];
              setType(selected);
              if (!name) {
                const found = eventTypes.find((t) => t.type === selected);
                if (found) setName(found.label);
              }
            }}
            className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          >
            {eventTypes.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Muhurtham / Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Venue & Map Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Venue / Hall Name
          </label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. A1 Convention Center, Benz Circle"
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Google Maps Link
          </label>
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.google.com/?q=..."
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Event Budget */}
        <AmountInput
          valuePaise={budgetPaise}
          onChangePaise={setBudgetPaise}
          label="Event Target Budget"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          {eventToEdit && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              aria-label="Delete Event"
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
            disabled={!name.trim()}
          >
            Save Event
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
