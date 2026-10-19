import React from 'react';

export interface ListItemProps {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`min-h-[64px] py-3 px-4 flex items-center justify-between gap-3.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] last:border-b-0 ${
        onClick ? 'cursor-pointer hover:bg-[var(--color-surface-2)] active:bg-[var(--color-border)] transition-colors' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="flex flex-col min-w-0">
          <div className="text-base font-medium text-[var(--color-text)] truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
    </div>
  );
};
