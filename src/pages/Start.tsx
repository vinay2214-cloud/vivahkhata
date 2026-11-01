import { errorMessage, timeToDate } from '../lib/errors';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, KeyRound, ArrowRight, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useWedding } from '../context/WeddingContext';
import { getInvite, joinWeddingWithInvite } from '../services/invites';
import { clearPendingInviteCode } from '../lib/pendingInvite';

interface StartProps {
  onCreateNew: () => void;
  onJoinSuccess: (wid: string) => void;
  /** Code from an invite link (/join/CODE), pre-filled for the person. */
  initialCode?: string | null;
  /** Shown when the person already has a wedding and opened an invite link. */
  onBack?: () => void;
}

export const Start: React.FC<StartProps> = ({
  onCreateNew,
  onJoinSuccess,
  initialCode,
  onBack,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { selectWedding, showToast } = useWedding();

  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 5) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const invite = await getInvite(code);
      if (!invite) {
        setError('Invite code not found. Please ask your family for a new link.');
        return;
      }

      if (invite.revoked) {
        setError('This invite code has been revoked by the wedding owner.');
        return;
      }

      // Check expiration
      if ((timeToDate(invite.expiresAt) ?? new Date(Infinity)) < new Date()) {
        setError('This invite link has expired (valid for 7 days).');
        return;
      }

      if (!profile) return;

      await joinWeddingWithInvite(invite, profile);
      clearPendingInviteCode();
      selectWedding(invite.weddingId);
      showToast(`Joined ${invite.weddingTitle} as ${invite.role}!`);
      onJoinSuccess(invite.weddingId);
    } catch (err) {
      setError(errorMessage(err, 'Failed to join wedding'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center p-4 sm:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Heart className="w-7 h-7 stroke-[2.2] fill-current" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-wedding text-[var(--color-text)]">
          {t('start.title', { name: profile?.displayName || user?.displayName || 'Family' })}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">{t('start.subtitle')}</p>
      </div>

      {initialCode && (
        <div className="mb-5 p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)] text-sm text-[var(--color-text)]">
          You were invited to join a family wedding. Your code{' '}
          <span className="font-mono font-bold">{initialCode}</span> is filled in below — just tap{' '}
          <span className="font-bold">{t('start.join_button')}</span>.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Card 1: Create a new wedding */}
        <div
          onClick={onCreateNew}
          className="p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                {t('start.create_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                {t('start.create_desc')}
              </p>
              <div className="mt-3 flex items-center text-xs font-bold text-[var(--color-primary)] gap-1">
                <span>Start 5-step wizard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Join with an invite code */}
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-sm">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {t('start.join_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                {t('start.join_desc')}
              </p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-2.5 mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder={t('start.enter_code')}
                className="flex-1 px-4 py-2.5 text-base font-mono font-bold tracking-widest uppercase bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={inviteCode.trim().length < 5}
              >
                {t('start.join_button')}
              </Button>
            </div>

            {error && <p className="text-xs text-[var(--color-danger)] font-medium">{error}</p>}
          </form>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={() => {
              clearPendingInviteCode();
              onBack();
            }}
            className="text-sm font-semibold text-[var(--color-primary)] underline underline-offset-4 py-2 cursor-pointer"
          >
            ← Back to my wedding
          </button>
        )}
      </div>
    </main>
  );
};
