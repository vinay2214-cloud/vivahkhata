import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { useAuth } from '../context/AuthContext';
import { useWedding } from '../context/WeddingContext';
import { createWedding } from '../services/weddings';
import { Side } from '../types';
import { DEFAULT_EVENT_TEMPLATES } from '../domain/defaultData';
import { getTodayDateString } from '../lib/dates';
import { toPaise } from '../lib/money';

interface CreateWizardProps {
  onBack: () => void;
  onSuccess: (wid: string) => void;
}

export const CreateWizard: React.FC<CreateWizardProps> = ({
  onBack,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { selectWedding, showToast } = useWedding();

  const [step, setStep] = useState(1);

  // Step 1: Couple
  const [brideName, setBrideName] = useState('Priya');
  const [groomName, setGroomName] = useState('Arjun');

  // Step 2: Date & City
  const [weddingDate, setWeddingDate] = useState('2026-11-22');
  const [city, setCity] = useState('Vijayawada');

  // Step 3: Side
  const [side, setSide] = useState<Side>('bride');

  // Step 4: Events
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    'engagement',
    'haldi',
    'mehendi',
    'wedding',
    'reception',
  ]);

  // Step 5: Budget
  const [budgetPaise, setBudgetPaise] = useState<number>(toPaise(2500000)); // Default ₹25,00,000

  const [loading, setLoading] = useState(false);

  const suggestedTitle = `${brideName.trim() || 'Bride'} weds ${groomName.trim() || 'Groom'}`;

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const wid = await createWedding({
        brideName: brideName.trim() || 'Bride',
        groomName: groomName.trim() || 'Groom',
        weddingDate: weddingDate || getTodayDateString(),
        city: city.trim() || 'India',
        side,
        selectedEventTypes,
        totalBudgetPaise: budgetPaise,
        ownerUid: user.uid,
        ownerDisplayName: profile?.displayName || user.displayName || 'Owner',
        ownerPhotoURL: user.photoURL || '',
      });

      selectWedding(wid);
      showToast('Wedding ledger created successfully! 🎉');
      onSuccess(wid);
    } catch (err: any) {
      showToast(err.message || 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Bar with Progress */}
      <div>
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('wizard.back')}</span>
          </button>

          <span className="text-xs font-bold text-[var(--color-primary)]">
            {t('wizard.step_counter', { step })}
          </span>
        </div>

        {/* 5-step progress bar */}
        <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full mt-3 overflow-hidden flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-full transition-colors ${
                s <= step ? 'bg-[var(--color-primary)]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="my-auto py-6">
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold font-serif-wedding text-[var(--color-text)]">
                {t('wizard.step1_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Enter the bride and groom's names for the ledger.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  {t('wizard.bride_name')} *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Priya"
                  className="w-full px-4 py-3 text-lg font-semibold bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  {t('wizard.groom_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Arjun"
                  className="w-full px-4 py-3 text-lg font-semibold bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="p-3.5 bg-[var(--color-primary-soft)] rounded-xl border border-[var(--color-primary)]/20">
                <span className="text-[11px] font-semibold text-[var(--color-primary)] uppercase block">
                  {t('wizard.suggested_title')}
                </span>
                <span className="text-base font-bold text-[var(--color-text)] font-serif-wedding">
                  "{suggestedTitle}"
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold font-serif-wedding text-[var(--color-text)]">
                {t('wizard.step2_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                When is the main muhurtham and where will the wedding happen?
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  {t('wizard.wedding_date')} *
                </label>
                <input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-4 py-3 text-base font-semibold bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  {t('wizard.city')} *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Vijayawada, Guntur, Hyderabad"
                  className="w-full px-4 py-3 text-base font-semibold bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold font-serif-wedding text-[var(--color-text)]">
                {t('wizard.step3_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                This helps organize expenses, guests, and gifts by family side.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  id: 'bride',
                  label: t('wizard.side_bride'),
                  desc: 'Tracking spending, sarees, and gifts for bride family',
                },
                {
                  id: 'groom',
                  label: t('wizard.side_groom'),
                  desc: 'Tracking spending, clothes, and gifts for groom family',
                },
                {
                  id: 'common',
                  label: t('wizard.side_both'),
                  desc: 'Shared workspace for both families together',
                },
              ].map((item) => {
                const isSelected = side === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSide(item.id as Side)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] shadow-xs'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-base text-[var(--color-text)]">
                        {item.label}
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold font-serif-wedding text-[var(--color-text)]">
                {t('wizard.step4_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Select the ceremonies to generate schedule, budget, and gift desks.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {DEFAULT_EVENT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedEventTypes.includes(tmpl.type);
                return (
                  <div
                    key={tmpl.type}
                    onClick={() => toggleEventType(tmpl.type)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    }`}
                  >
                    <span className="font-bold text-sm text-[var(--color-text)]">
                      {tmpl.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold font-serif-wedding text-[var(--color-text)]">
                {t('wizard.step5_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {t('wizard.budget_optional')}
              </p>
            </div>

            <AmountInput
              valuePaise={budgetPaise}
              onChangePaise={setBudgetPaise}
              quickChips={[1000000, 2000000, 3000000, 5000000, 10000000]}
              autoFocus
            />

            <button
              type="button"
              onClick={() => {
                setBudgetPaise(0);
                handleFinish();
              }}
              className="text-xs font-semibold text-[var(--color-text-muted)] hover:underline self-center pt-2 cursor-pointer"
            >
              {t('wizard.budget_skip')}
            </button>
          </div>
        )}
      </div>

      {/* Wizard Footer Navigation */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        {step < 5 ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 1 && (!brideName.trim() || !groomName.trim())) ||
              (step === 2 && (!weddingDate || !city.trim()))
            }
          >
            <span>{t('wizard.next')}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleFinish}
          >
            {t('wizard.create')}
          </Button>
        )}
      </div>
    </div>
  );
};
