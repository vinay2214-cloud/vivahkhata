import React from 'react';
import { AmountText } from './AmountText';
import { ProgressBar } from './ProgressBar';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'soft' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  className = '',
  ...props
}) => {
  const variantClasses = {
    surface: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm',
    soft: 'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
    outline: 'bg-transparent border-2 border-[var(--color-border)]',
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 transition-shadow ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  label: string;
  paise: number | null | undefined;
  subText?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'default';
  progress?: {
    current: number;
    total: number;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  paise,
  subText,
  icon,
  variant = 'default',
  progress,
  onClick,
  className = '',
}) => {
  const borderHighlight = {
    default: 'border-l-4 border-l-[var(--color-border)]',
    primary: 'border-l-4 border-l-[var(--color-primary)]',
    accent: 'border-l-4 border-l-[var(--color-accent)]',
    success: 'border-l-4 border-l-[var(--color-success)]',
    warning: 'border-l-4 border-l-[var(--color-warning)]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between gap-2 ${borderHighlight[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
        <span>{label}</span>
        {icon && <span className="text-[var(--color-primary)]">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <AmountText paise={paise} className="text-xl sm:text-2xl font-bold text-[var(--color-text)]" />
      </div>

      {progress && (
        <ProgressBar
          value={progress.current}
          max={progress.total}
          className="mt-1"
        />
      )}

      {subText && (
        <p className="text-xs text-[var(--color-text-muted)] truncate">
          {subText}
        </p>
      )}
    </div>
  );
};
