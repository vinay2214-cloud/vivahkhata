import React, { useEffect, useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { writeThankYouWithGemini } from '../../lib/geminiParser';
import { aiErrorMessage } from '../../lib/aiErrors';
import { templateThanks, whatsappLink, type ThanksLanguage } from '../../lib/thanks';
import type { Gift } from '../../types';

interface Props {
  gift: Gift | null;
  hostNames: string;
  onClose: () => void;
}

const LANGUAGES: Array<{ id: ThanksLanguage; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'hi', label: 'हिन्दी' },
];

export const ThankYouSheet: React.FC<Props> = ({ gift, hostNames, onClose }) => {
  const [language, setLanguage] = useState<ThanksLanguage>('te');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Start every opening with a plain template so the sheet is useful even with no network.
  useEffect(() => {
    if (!gift) return;
    setNotice('');
    setMessage(templateThanks({ giverName: gift.giverName, hostNames }, language));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gift?.id, language]);

  if (!gift) return null;

  const write = async () => {
    setLoading(true);
    setNotice('');
    try {
      const text = await writeThankYouWithGemini({
        giverName: gift.giverName,
        relation: gift.relation,
        town: gift.town,
        cashPaise: gift.cashPaise,
        hostNames,
        language,
      });
      if (text) setMessage(text);
      else setNotice('Gemini returned nothing usable. The simple message is kept.');
    } catch (err) {
      setNotice(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen onClose={onClose} title={`Thank ${gift.giverName}`}>
      <div className="flex flex-col gap-4 p-1">
        <div role="group" aria-label="Message language" className="flex gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={language === l.id}
              onClick={() => setLanguage(l.id)}
              className={`px-4 min-h-12 rounded-full border text-sm font-semibold cursor-pointer ${
                language === l.id
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--color-text)]">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-base font-normal"
          />
        </label>

        <p
          role="status"
          aria-live="polite"
          className="text-xs text-[var(--color-text-muted)] min-h-4"
        >
          {notice ||
            'You can edit the message before sending. The gift amount is never written in it.'}
        </p>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          loading={loading}
          onClick={write}
          icon={<Sparkles className="w-4 h-4 text-[var(--color-accent)]" />}
        >
          Write with Gemini
        </Button>
        <a
          href={whatsappLink(message, gift.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-12 rounded-xl bg-[#1FA855] text-white font-bold text-base"
        >
          <MessageCircle className="w-5 h-5" /> Send on WhatsApp
        </a>
      </div>
    </BottomSheet>
  );
};
