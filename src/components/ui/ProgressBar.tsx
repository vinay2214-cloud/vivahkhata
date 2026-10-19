import React from 'react';

export interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  className = '',
  showLabels = false,
}) => {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const rawRatio = max > 0 ? (value / max) * 100 : 0;

  let colorClass = 'bg-[var(--color-primary)]';
  if (rawRatio > 100) {
    colorClass = 'bg-[var(--color-danger)]';
  } else if (rawRatio > 90) {
    colorClass = 'bg-[var(--color-warning)]';
  } else if (rawRatio > 0) {
    colorClass = 'bg-[var(--color-success)]';
  }

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabels && (
        <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-medium">
          <span>{rawRatio.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border)]">
        <div
          className={`h-full transition-all duration-300 rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
