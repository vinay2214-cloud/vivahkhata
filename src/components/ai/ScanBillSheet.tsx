import React, { useState } from 'react';
import { Camera, Image as ImageIcon, QrCode, Sparkles, AlertCircle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { aiErrorMessage } from '../../lib/aiErrors';
import { ParsedAIDraft } from './ConfirmCard';

interface ScanBillSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (draft: ParsedAIDraft) => void;
}

export const ScanBillSheet: React.FC<ScanBillSheetProps> = ({
  isOpen,
  onClose,
  onParsed,
}) => {
  const { wedding, vendors, members, events } = useWedding();
  const { user, profile } = useAuth();
  const isDemo = !!user?.isAnonymous;
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same photo again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo or screenshot.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
    setLoading(true);
    try {
      // Loaded on demand so the AI library doesn't slow down the first app load.
      const { readBillWithGemini } = await import('../../lib/geminiParser');
      const draft = await readBillWithGemini(
        file,
        {
          categories: wedding?.categories || [],
          vendors,
          members,
          events,
          speakerName: profile?.displayName || user?.displayName || 'Me',
        },
        url
      );
      onClose();
      onParsed(draft);
    } catch (err) {
      console.error('Bill reading failed', err);
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTestSample = (sampleType: 'phonepe' | 'bill') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let draft: ParsedAIDraft;
      if (sampleType === 'phonepe') {
        draft = {
          kind: 'expense',
          expense: {
            amountRupees: 25000,
            categoryId: 'photography',
            vendorName: 'Creative Wedding Studio',
            vendorId: null,
            paidByName: 'Kiran (Brother)',
            paidByUid: null,
            mode: 'upi',
            type: 'advance',
            eventId: null,
            date: new Date().toISOString().split('T')[0],
            upiRef: 'T261019031204',
            note: 'PhonePe payment to Creative Wedding Studio',
          },
          confidence: {
            'expense.amountRupees': 'high',
            'expense.categoryId': 'high',
          },
          warnings: [],
        };
      } else {
        draft = {
          kind: 'expense',
          expense: {
            amountRupees: 48500,
            categoryId: 'clothing',
            vendorName: 'Kanchipuram Silk Sarees',
            vendorId: null,
            paidByName: 'Lakshmi (Aunt)',
            paidByUid: null,
            mode: 'card',
            type: 'full',
            eventId: null,
            date: new Date().toISOString().split('T')[0],
            upiRef: null,
            note: 'Sarees purchased for Pellikoothuru function',
          },
          confidence: {
            'expense.amountRupees': 'high',
            'expense.categoryId': 'high',
          },
          warnings: [],
        };
      }
      onClose();
      onParsed(draft);
    }, 1000);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Scan Bill or UPI Screenshot">
      <div className="flex flex-col gap-5 py-2 pb-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Take a photo of vendor receipt or screenshot of PhonePe / GPay
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Gemini reads the total amount, vendor, date, and payment mode
          </p>
        </div>

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)] bg-[var(--color-surface)] cursor-pointer transition-colors text-center">
            <Camera className="w-8 h-8 text-[var(--color-primary)] mb-2" />
            <span className="text-sm font-semibold text-[var(--color-text)]">
              Take Photo
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Receipt / Invoice
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)] bg-[var(--color-surface)] cursor-pointer transition-colors text-center">
            <ImageIcon className="w-8 h-8 text-[var(--color-accent)] mb-2" />
            <span className="text-sm font-semibold text-[var(--color-text)]">
              From Gallery
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              UPI Screenshot
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {previewUrl && (loading || error) && (
          <img
            src={previewUrl}
            alt="Selected bill"
            className="max-h-40 mx-auto rounded-xl border border-[var(--color-border)] object-contain"
          />
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-danger)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[var(--color-primary)]">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Reading bill and extracting details…</span>
          </div>
        )}

        {/* Sample scans — demo mode only, so real weddings never get sample data */}
        {isDemo && (
        <div className="pt-3 border-t border-[var(--color-border)]">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
            Try Demo Scan Samples:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTestSample('phonepe')}
              className="p-3 text-left bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
                <QrCode className="w-3.5 h-3.5" />
                PhonePe Payment
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                ₹25,000 Photography advance
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTestSample('bill')}
              className="p-3 text-left bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)]">
                <ImageIcon className="w-3.5 h-3.5" />
                Printed Invoice
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                ₹48,500 Silk Sarees Bill
              </p>
            </button>
          </div>
        </div>
        )}
      </div>
    </BottomSheet>
  );
};
