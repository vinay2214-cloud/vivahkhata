import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AmountText } from '../ui/AmountText';
import type { SettleResult } from '../../domain/settle';

interface SettleUpCardProps {
  settle: SettleResult;
}

/** Who owes whom if everyone who paid shared the total equally. */
export const SettleUpCard: React.FC<SettleUpCardProps> = ({ settle }) => (
  <section
    className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs"
    aria-labelledby="settle-title"
  >
    <h2
      id="settle-title"
      className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider"
    >
      Settle up
    </h2>
    <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">
      If the {settle.balances.length} people who paid share equally, each share is{' '}
      <AmountText paise={settle.sharePaise} className="font-bold" />.
    </p>
    {settle.transfers.length === 0 ? (
      <p className="text-sm font-semibold text-[var(--color-success)]">
        Everyone is even. Nothing to settle.
      </p>
    ) : (
      <ul className="flex flex-col gap-2">
        {settle.transfers.map((tr) => (
          <li
            key={`${tr.from}-${tr.to}`}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] text-sm"
          >
            <span className="font-semibold text-[var(--color-text)] min-w-0 truncate">
              {tr.from}{' '}
              <ArrowRight
                className="inline w-3.5 h-3.5 mx-1 text-[var(--color-text-muted)]"
                aria-label="pays"
              />{' '}
              {tr.to}
            </span>
            <AmountText
              paise={tr.amountPaise}
              className="font-bold text-[var(--color-primary)] shrink-0"
            />
          </li>
        ))}
      </ul>
    )}
  </section>
);
