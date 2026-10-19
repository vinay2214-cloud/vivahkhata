import React from 'react';
import { toPaise } from '../../lib/money';

interface AmountInputProps {
  valuePaise: number;
  onChangePaise: (paise: number) => void;
  label?: string;
  quickChips?: number[];
  autoFocus?: boolean;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  valuePaise,
  onChangePaise,
  label,
  quickChips = [500, 1000, 2000, 5000, 10000],
  autoFocus = false,
  className = '',
}) => {
  const rupees = valuePaise > 0 ? (valuePaise / 100).toString() : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    // Cap at 10 crore rupees
    if (num <= 100000000) {
      onChangePaise(toPaise(num));
    }
  };

  const handleChipClick = (amountRupees: number) => {
    onChangePaise(toPaise(amountRupees));
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-4 text-2xl font-bold text-[var(--color-primary)] select-none">
          ₹
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={rupees ? Number(rupees).toLocaleString('en-IN') : ''}
          onChange={handleChange}
          placeholder="0"
          className="w-full pl-10 pr-4 py-3.5 text-3xl font-bold tabular-nums text-[var(--color-text)] bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none transition-colors"
        />
      </div>

      {quickChips && quickChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickChips.map((chip) => {
            const isSelected = valuePaise === chip * 100;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                +₹{chip.toLocaleString('en-IN')}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
