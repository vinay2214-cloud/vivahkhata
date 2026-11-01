import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'accent' | 'primary' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    neutral:
      'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]',
    primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold',
    accent: 'bg-[var(--color-accent-soft)] text-[#8C5D00] font-semibold',
    success: 'bg-[#E3F4EA] text-[var(--color-success)] font-semibold',
    warning: 'bg-[#FEF3D6] text-[var(--color-warning)] font-semibold',
    danger: 'bg-[#FDE8E8] text-[var(--color-danger)] font-semibold',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
