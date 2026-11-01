import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Users,
  Sparkles,
  Settings,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Database,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { AmountText } from '../components/ui/AmountText';
import { formatDate } from '../lib/dates';
import { seedDemoWedding } from '../services/demoData';
import { WeddingEvent } from '../types';
import { switchLanguage } from '../i18n';

interface MoreMenuProps {
  onOpenEventModal: (event?: WeddingEvent) => void;
  onOpenMembers: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  onOpenEventModal,
  onOpenMembers,
}) => {
  const { t, i18n } = useTranslation();
  const { weddingId, wedding, events, showToast } = useWedding();
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  const handleSeedDemoData = async () => {
    if (!weddingId || !user) return;
    setSeeding(true);

    try {
      await seedDemoWedding(weddingId, user.uid);
      showToast('Demo data loaded successfully! Check Dashboard and Money.');
    } catch (err: any) {
      showToast(err.message || 'Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Wedding Ceremonies Timeline */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-bold font-serif-wedding text-[var(--color-text)]">
              Wedding Ceremonies & Events ({events.length})
            </h2>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenEventModal()}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Ceremony
          </Button>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-2">
            No events added. Tap "Add Ceremony" above to build your wedding timeline.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 divide-y divide-[var(--color-border)]">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onOpenEventModal(ev)}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)] p-2 rounded-xl transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">
                    {ev.name}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
                    {ev.date && <span>{formatDate(ev.date)}</span>}
                    {ev.startTime && <span>• {ev.startTime}</span>}
                    {ev.venue && <span>• {ev.venue}</span>}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {ev.budgetPaise ? (
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Budget: <AmountText paise={ev.budgetPaise} />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Family Members & Invites */}
        <div
          onClick={onOpenMembers}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              {t('members.title')}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Manage family access & WhatsApp invite links
            </p>
          </div>
        </div>

        {/* Language Switch */}
        <div
          onClick={() => switchLanguage(currentLang === 'en' ? 'te' : 'en')}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] shadow-xs transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)] text-[#8C5D00] flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              Language (భాష)
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Current: {currentLang === 'en' ? 'English (Switch to తెలుగు)' : 'తెలుగు (Switch to English)'}
            </p>
          </div>
        </div>
      </div>

      {/* Demo data seeder — only in Demo mode or local development, never on a real family wedding */}
      {(user?.isAnonymous || import.meta.env.DEV) && (
      <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[var(--color-primary)]">
          <Database className="w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">
            Reviewer / Pilot Demo Data
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Instantly populate this wedding ledger with realistic Indian wedding expenses, vendors with payment schedules, and cash/gold gift records for testing and demonstration.
        </p>
        <Button
          variant="outline"
          size="md"
          loading={seeding}
          onClick={handleSeedDemoData}
          icon={<Sparkles className="w-4 h-4 text-[var(--color-accent)]" />}
        >
          Load Wedding Demo Data (Catering, Decor, Gifts)
        </Button>
      </div>
      )}
    </div>
  );
};
