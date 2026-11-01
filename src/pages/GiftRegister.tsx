import { timeToDate } from '../lib/errors';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift as GiftIcon, Download, ArrowRight, Gem } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { AmountText } from '../components/ui/AmountText';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { formatGoldMg } from '../lib/money';
import { Gift } from '../types';
import { ThankYouSheet } from '../components/gift/ThankYouSheet';
import { repeatGivers } from '../domain/giverHistory';

interface GiftRegisterProps {
  onOpenGiftDesk: () => void;
  onOpenGiftSheet: (gift?: Gift) => void;
}

export const GiftRegister: React.FC<GiftRegisterProps> = ({ onOpenGiftDesk, onOpenGiftSheet }) => {
  const { t } = useTranslation();
  const { wedding, gifts, totals, events } = useWedding();
  const [searchQuery, setSearchQuery] = useState('');
  const [thankGift, setThankGift] = useState<Gift | null>(null);
  type SideFilter = 'all' | 'bride' | 'groom' | 'common';
  const [selectedSideFilter, setSelectedSideFilter] = useState<SideFilter>('all');

  const filteredGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (selectedSideFilter !== 'all' && g.side !== selectedSideFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = g.giverName.toLowerCase().includes(query);
        const matchTown = (g.town || '').toLowerCase().includes(query);
        const matchRelation = (g.relation || '').toLowerCase().includes(query);
        const matchItems = (g.items || '').toLowerCase().includes(query);
        return matchName || matchTown || matchRelation || matchItems;
      }
      return true;
    });
  }, [gifts, searchQuery, selectedSideFilter]);

  const repeats = useMemo(() => repeatGivers(gifts), [gifts]);

  // CSV Export with UTF-8 BOM so Telugu characters display properly in Excel & Google Sheets
  const handleExportCSV = () => {
    const headers = [
      'Envelope No',
      'Giver Name',
      'Relation',
      'Town',
      'Side',
      'Event',
      'Cash (Rupees)',
      'Cash (Paise)',
      'Gold (Grams)',
      'Gold Description',
      'Other Items',
      'Note',
      'Date',
    ];
    const rows = gifts.map((g) => {
      const eventName = events.find((e) => e.id === g.eventId)?.name || 'General';
      return [
        g.envelopeNo || '',
        `"${g.giverName.replace(/"/g, '""')}"`,
        `"${(g.relation || '').replace(/"/g, '""')}"`,
        `"${(g.town || '').replace(/"/g, '""')}"`,
        g.side,
        `"${eventName.replace(/"/g, '""')}"`,
        (g.cashPaise / 100).toString(),
        g.cashPaise.toString(),
        g.goldMg ? (g.goldMg / 1000).toString() : '',
        `"${(g.goldDescription || '').replace(/"/g, '""')}"`,
        `"${(g.items || '').replace(/"/g, '""')}"`,
        `"${(g.note || '').replace(/"/g, '""')}"`,
        timeToDate(g.createdAt)?.toISOString() ?? '',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${wedding?.title || 'Wedding'}_Gift_Register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Gift Totals Banner */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GiftIcon className="w-5 h-5 text-[var(--color-accent)]" />
            <h1 className="text-lg font-bold font-serif-wedding text-[var(--color-text)]">
              {t('gifts.title')}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] rounded-lg transition-colors cursor-pointer border border-[var(--color-border)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('gifts.export_csv')}</span>
          </button>
        </div>

        {/* 3 Summary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--color-border)]">
          <div>
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase block">
              {t('gifts.total_cash')}
            </span>
            <AmountText
              paise={totals.totalGiftsCashPaise}
              className="text-base sm:text-xl font-bold text-[var(--color-primary)]"
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase block">
              Total Count
            </span>
            <span className="text-base sm:text-xl font-bold text-[var(--color-text)] tabular-nums">
              {totals.totalGiftsCount}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase block">
              {t('gifts.total_gold')}
            </span>
            <span className="text-base sm:text-xl font-bold text-[#8C5D00] tabular-nums">
              {totals.totalGiftsGoldMg > 0 ? formatGoldMg(totals.totalGiftsGoldMg) : '0g'}
            </span>
          </div>
        </div>

        {/* Big Gift Desk Action Button */}
        <button
          type="button"
          onClick={onOpenGiftDesk}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D99A1E] to-[#9B1C31] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer"
        >
          <GiftIcon className="w-5 h-5" />
          <span>{t('gifts.open_desk')}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {repeats.length > 0 && (
        <section
          className="p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[#F2B84B]/40"
          aria-labelledby="repeat-title"
        >
          <h2
            id="repeat-title"
            className="text-xs font-bold uppercase tracking-wider text-[#8C5D00]"
          >
            Gave more than once
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {repeats.slice(0, 5).map((r) => (
              <li key={r.nameKey} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[var(--color-text)] truncate">
                  {r.giverName}{' '}
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">
                    · {r.count} gifts
                  </span>
                </span>
                <AmountText
                  paise={r.totalCashPaise}
                  className="font-bold text-[var(--color-primary)] shrink-0"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-2.5">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('gifts.search_placeholder')}
        />

        {/* Side filter chips */}
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Gifts' },
              { id: 'bride', label: wedding?.sides?.bride?.label || 'Bride Side' },
              { id: 'groom', label: wedding?.sides?.groom?.label || 'Groom Side' },
              { id: 'common', label: 'Common' },
            ] as { id: SideFilter; label: string }[]
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedSideFilter(chip.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                selectedSideFilter === chip.id
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Items List */}
      {filteredGifts.length === 0 ? (
        <EmptyState
          title="No gifts recorded yet"
          description={t('gifts.no_gifts')}
          actionLabel="Open Gift Desk Mode"
          onAction={onOpenGiftDesk}
        />
      ) : (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs divide-y divide-[var(--color-border)] overflow-hidden">
          {filteredGifts.map((gift) => (
            <div
              key={gift.id}
              onClick={() => onOpenGiftSheet(gift)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {gift.envelopeNo ? (
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] text-[#8C5D00] flex flex-col items-center justify-center font-bold text-xs shrink-0 tabular-nums">
                    <span className="text-[9px] uppercase leading-none text-neutral-500">Env</span>
                    <span>#{gift.envelopeNo}</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text-muted)] flex items-center justify-center shrink-0">
                    <GiftIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[var(--color-text)] truncate">
                    {gift.giverName}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                    {gift.town && <span>{gift.town}</span>}
                    {gift.relation && <span> • {gift.relation}</span>}
                    {gift.goldMg ? (
                      <span className="text-[#8C5D00] font-semibold flex items-center gap-1 inline-flex ml-1.5">
                        <Gem className="w-3 h-3 inline" /> {formatGoldMg(gift.goldMg)}
                      </span>
                    ) : null}
                    {gift.items && <span> • {gift.items}</span>}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <AmountText
                  paise={gift.cashPaise}
                  className="font-bold text-base text-[var(--color-primary)]"
                />
                <button
                  type="button"
                  aria-label={`Write a thank-you to ${gift.giverName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setThankGift(gift);
                  }}
                  className="text-xs font-bold text-[var(--color-primary)] px-2 min-h-8 rounded-lg border border-[var(--color-border)] cursor-pointer"
                >
                  Thank
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ThankYouSheet
        gift={thankGift}
        hostNames={[wedding?.brideName, wedding?.groomName].filter(Boolean).join(' & ')}
        onClose={() => setThankGift(null)}
      />
    </div>
  );
};
