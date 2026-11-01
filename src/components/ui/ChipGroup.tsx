import React from 'react';
import { Check } from 'lucide-react';

export interface ChipOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ChipGroupProps {
  options: ChipOption[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  options,
  selectedId,
  onChange,
  className = '',
}) => {
  const isSelected = (id: string) => selectedId === id;
  const handleClick = (id: string) => onChange(id);

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 ${className}`}>
      {options.map((opt) => {
        const active = isSelected(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleClick(opt.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full transition-all shrink-0 cursor-pointer border select-none ${
              active
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)] font-semibold shadow-xs'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {active && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>
        );
      })}
    </div>
  );
};
