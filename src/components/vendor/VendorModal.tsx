import { errorMessage } from '../../lib/errors';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { createVendor, updateVendor, softDeleteVendor } from '../../services/vendors';
import { Vendor, VendorScheduleItem } from '../../types';
import { toPaise } from '../../lib/money';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
}

export const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, vendorToEdit }) => {
  const { weddingId, wedding, showToast } = useWedding();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('catering');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedPaise, setAgreedPaise] = useState(0);
  const [schedule, setSchedule] = useState<VendorScheduleItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name);
      setCategoryId(vendorToEdit.categoryId);
      setContactName(vendorToEdit.contactName || '');
      setPhone(vendorToEdit.phone || '');
      setAgreedPaise(vendorToEdit.agreedPaise || 0);
      setSchedule(vendorToEdit.schedule || []);
      setNotes(vendorToEdit.notes || '');
    } else {
      setName('');
      setCategoryId('catering');
      setContactName('');
      setPhone('');
      setAgreedPaise(0);
      setSchedule([
        {
          id: Math.random().toString(36).substring(2, 9),
          label: 'Advance Token',
          amountPaise: 0,
          dueDate: '',
        },
        {
          id: Math.random().toString(36).substring(2, 9),
          label: 'Final Balance',
          amountPaise: 0,
          dueDate: '',
        },
      ]);
      setNotes('');
    }
  }, [isOpen, vendorToEdit]);

  if (!weddingId || !user) return null;

  const categories = wedding?.categories || [];

  const handleAddScheduleRow = () => {
    setSchedule((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        label: `Payment #${prev.length + 1}`,
        amountPaise: 0,
        dueDate: '',
      },
    ]);
  };

  const handleUpdateScheduleRow = (
    id: string,
    field: keyof VendorScheduleItem,
    val: VendorScheduleItem[keyof VendorScheduleItem]
  ) => {
    setSchedule((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  };

  const handleRemoveScheduleRow = (id: string) => {
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const input = {
        name,
        categoryId,
        contactName,
        phone,
        agreedPaise,
        schedule,
        notes,
      };

      if (vendorToEdit) {
        await updateVendor(weddingId, vendorToEdit.id, input, user.uid);
        showToast('Vendor updated');
      } else {
        await createVendor(weddingId, input, user.uid);
        showToast('Vendor added to directory');
      }
      onClose();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save vendor'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vendorToEdit) return;
    if (window.confirm('Delete this vendor?')) {
      try {
        await softDeleteVendor(weddingId, vendorToEdit.id, user.uid);
        showToast('Vendor removed');
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
      title={vendorToEdit ? 'Edit Vendor Details' : 'Add Wedding Vendor'}
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4 pb-6">
        {/* Vendor Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Vendor / Business Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sri Lakshmi Caterers"
            className="w-full px-3.5 py-2.5 text-base font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Category & Contact */}
        <div className="grid grid-cols-2 gap-3">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Contact Person
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Ramesh"
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Phone Number (for Call & WhatsApp)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Agreed Total Package Amount */}
        <AmountInput
          valuePaise={agreedPaise}
          onChangePaise={setAgreedPaise}
          label="Total Agreed Contract Amount"
        />

        {/* Payment Due Schedule */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Payment Schedule & Dues
            </label>
            <button
              type="button"
              onClick={handleAddScheduleRow}
              className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add installment
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {schedule.map((row) => (
              <div
                key={row.id}
                className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => handleUpdateScheduleRow(row.id, 'label', e.target.value)}
                    placeholder="Installment label"
                    className="flex-1 px-2.5 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduleRow(row.id)}
                    className="text-neutral-400 hover:text-[var(--color-danger)] p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={row.amountPaise > 0 ? row.amountPaise / 100 : ''}
                    onChange={(e) =>
                      handleUpdateScheduleRow(
                        row.id,
                        'amountPaise',
                        toPaise(Number(e.target.value) || 0)
                      )
                    }
                    placeholder="Amount (₹)"
                    className="px-2.5 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold"
                  />
                  <input
                    type="date"
                    value={row.dueDate || ''}
                    onChange={(e) => handleUpdateScheduleRow(row.id, 'dueDate', e.target.value)}
                    className="px-2 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Notes & Terms
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Menu for 800 guests, breakfast and dinner included"
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3">
          {vendorToEdit && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              aria-label="Delete vendor"
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
            Save Vendor
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
