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
import { toPaise } from '../lib/money';
import { createExpense } from '../services/expenses';
import { createVendor } from '../services/vendors';
import { createGift } from '../services/gifts';
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
      // 1. Seed 4 Vendors with payment schedules
      const v1 = await createVendor(
        weddingId,
        {
          name: 'Sri Lakshmi Caterers & Sweets',
          categoryId: 'catering',
          contactName: 'Ramesh Naidu',
          phone: '+91 98480 11223',
          agreedPaise: toPaise(450000),
          schedule: [
            {
              id: 's1',
              label: 'Advance Token',
              amountPaise: toPaise(100000),
              dueDate: '2026-10-15',
              paid: true,
            },
            {
              id: 's2',
              label: 'Haldi Function Due',
              amountPaise: toPaise(150000),
              dueDate: '2026-10-20',
              paid: false,
            },
            {
              id: 's3',
              label: 'Wedding Day Balance',
              amountPaise: toPaise(200000),
              dueDate: '2026-11-22',
              paid: false,
            },
          ],
          notes: '800 persons breakfast, lunch and dinner on Muhurtham day',
        },
        user.uid
      );

      const v2 = await createVendor(
        weddingId,
        {
          name: 'Royal Mandapam & Flower Decor',
          categoryId: 'decoration',
          contactName: 'Suresh Kumar',
          phone: '+91 99887 66554',
          agreedPaise: toPaise(280000),
          schedule: [
            {
              id: 's4',
              label: 'Stage Decoration Advance',
              amountPaise: toPaise(80000),
              dueDate: '2026-10-10',
              paid: true,
            },
            {
              id: 's5',
              label: 'Pellikuthuru Stage Due',
              amountPaise: toPaise(100000),
              dueDate: '2026-10-18', // Overdue test
              paid: false,
            },
            {
              id: 's6',
              label: 'Reception Final Due',
              amountPaise: toPaise(100000),
              dueDate: '2026-11-23',
              paid: false,
            },
          ],
          notes: 'Traditional jasmine and marigold floral theme',
        },
        user.uid
      );

      const v3 = await createVendor(
        weddingId,
        {
          name: 'Creative Studio Photography & Cinematography',
          categoryId: 'photography',
          contactName: 'Kiran Studio',
          phone: '+91 91234 56789',
          agreedPaise: toPaise(180000),
          schedule: [
            {
              id: 's7',
              label: 'Booking Advance',
              amountPaise: toPaise(50000),
              dueDate: '2026-10-01',
              paid: true,
            },
            {
              id: 's8',
              label: 'Album Delivery Balance',
              amountPaise: toPaise(130000),
              dueDate: '2026-12-05',
              paid: false,
            },
          ],
        },
        user.uid
      );

      // 2. Seed realistic expenses across categories and payers
      const sampleExpenses = [
        {
          amountPaise: toPaise(100000),
          categoryId: 'catering',
          vendorId: v1,
          scheduleItemId: 's1',
          paidByName: 'Srinivasa Rao (Dad)',
          mode: 'bank' as const,
          type: 'advance' as const,
          date: '2026-10-15',
          side: 'bride' as const,
          note: 'Banquet token advance paid via NEFT',
        },
        {
          amountPaise: toPaise(80000),
          categoryId: 'decoration',
          vendorId: v2,
          scheduleItemId: 's4',
          paidByName: 'Kiran (Brother)',
          mode: 'upi' as const,
          type: 'advance' as const,
          date: '2026-10-10',
          side: 'common' as const,
          note: 'Flower mandapam booking advance',
        },
        {
          amountPaise: toPaise(50000),
          categoryId: 'photography',
          vendorId: v3,
          scheduleItemId: 's7',
          paidByName: 'Kiran (Brother)',
          mode: 'upi' as const,
          type: 'advance' as const,
          date: '2026-10-01',
          side: 'common' as const,
          note: 'Drone and pre-wedding shoot advance',
        },
        {
          amountPaise: toPaise(75000),
          categoryId: 'clothing',
          paidByName: 'Lakshmi (Aunt)',
          mode: 'card' as const,
          type: 'full' as const,
          date: '2026-10-14',
          side: 'bride' as const,
          note: 'Kanchi silk sarees bought for pellikoothuru',
        },
        {
          amountPaise: toPaise(25000),
          categoryId: 'priest',
          paidByName: 'Srinivasa Rao (Dad)',
          mode: 'cash' as const,
          type: 'full' as const,
          date: '2026-10-18',
          side: 'bride' as const,
          note: 'Pooja samagri and purohit dakshina',
        },
        {
          amountPaise: toPaise(15000),
          categoryId: 'invitations',
          paidByName: 'Arjun (Groom)',
          mode: 'upi' as const,
          type: 'full' as const,
          date: '2026-10-12',
          side: 'groom' as const,
          note: 'Printed wedding cards and courier',
        },
      ];

      for (const exp of sampleExpenses) {
        await createExpense(weddingId, exp, user.uid);
      }

      // 3. Seed realistic gifts (Telugu & English, some gold)
      const sampleGifts = [
        {
          envelopeNo: 1,
          giverName: 'Venkata Subbaiah Garu & Family',
          town: 'Tenali',
          relation: 'Pedananna',
          cashPaise: toPaise(10116),
          side: 'bride' as const,
          note: 'Silver lamp + Cash envelope',
        },
        {
          envelopeNo: 2,
          giverName: 'Ramesh Chandra Garu',
          town: 'Guntur',
          relation: 'Menamama',
          cashPaise: toPaise(5000),
          side: 'bride' as const,
          note: 'Given on engagement day',
        },
        {
          envelopeNo: 3,
          giverName: 'Sita Ram & Geetha',
          town: 'Hyderabad',
          relation: 'Cousin',
          cashPaise: toPaise(2000),
          goldMg: 2000,
          goldDescription: '2g Gold Ring',
          side: 'common' as const,
        },
        {
          envelopeNo: 4,
          giverName: 'Prasad Rao Garu',
          town: 'Vijayawada',
          relation: 'Friend of Dad',
          cashPaise: toPaise(5116),
          side: 'bride' as const,
        },
        {
          envelopeNo: 5,
          giverName: 'Anand & Divya',
          town: 'Bengaluru',
          relation: 'Colleague',
          cashPaise: toPaise(2500),
          items: 'Titan Pair Watches',
          side: 'groom' as const,
        },
      ];

      for (const gift of sampleGifts) {
        await createGift(weddingId, gift, user.uid);
      }

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
