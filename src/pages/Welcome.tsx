import { logger } from '../lib/logger';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IndianRupee, Gift, WifiOff, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { switchLanguage, nextLanguage, asAppLanguage, LANGUAGE_LABEL } from '../i18n';

interface WelcomeProps {
  onSuccess: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { signInWithGoogle, signInDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const currentLang = asAppLanguage(i18n.language);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (error) {
      logger.error('Sign-in failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    try {
      await signInDemo();
      onSuccess();
    } catch (error) {
      logger.error('Sign-in failed', error);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Language Toggle */}
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-serif-wedding font-bold text-lg shadow-sm">
            VK
          </div>
          <span className="font-serif-wedding font-bold text-lg text-[var(--color-primary)]">
            {t('app.name')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => switchLanguage(nextLanguage(currentLang))}
          className="text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] transition-colors cursor-pointer"
        >
          {LANGUAGE_LABEL[nextLanguage(currentLang)]}
        </button>
      </div>

      {/* Hero */}
      <div className="my-auto py-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-5 shadow-sm">
          <IndianRupee className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-serif-wedding text-[var(--color-text)] tracking-tight leading-tight">
          {t('welcome.title')}
        </h1>
        <p className="text-base text-[var(--color-text-muted)] mt-2.5 max-w-sm leading-relaxed">
          {t('welcome.subtitle')}
        </p>

        {/* 3 Value Pillars */}
        <div className="w-full mt-8 flex flex-col gap-3 text-left">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[var(--color-text)]">
                {t('welcome.benefit1_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                {t('welcome.benefit1_desc')}
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[var(--color-text)]">
                {t('welcome.benefit2_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                {t('welcome.benefit2_desc')}
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[var(--color-text)]">
                {t('welcome.benefit3_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                {t('welcome.benefit3_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleGoogleSignIn}
        >
          {t('welcome.google_signin')}
        </Button>

        <Button
          variant="outline"
          size="md"
          fullWidth
          loading={demoLoading}
          onClick={handleDemoSignIn}
          icon={<Sparkles className="w-4 h-4 text-[var(--color-accent)]" />}
        >
          {t('welcome.guest_signin')}
        </Button>

        <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-1">
          {t('welcome.privacy_note')}
        </p>
      </div>
    </main>
  );
};
