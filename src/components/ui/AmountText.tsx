import React from 'react';
import { formatINR, compactINR } from '../../lib/money';

interface AmountTextProps {
  paise: number | null | undefined;
  compact?: boolean;
  className?: string;
}

export const AmountText: React.FC<AmountTextProps> = ({
  paise,
  compact = false,
  className = '',
}) => {
  const formatted = compact ? compactINR(paise) : formatINR(paise);
  return (
    <span className={`tabular-nums font-semibold tracking-tight ${className}`}>{formatted}</span>
  );
};
