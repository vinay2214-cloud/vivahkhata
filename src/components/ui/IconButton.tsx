import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'ghost' | 'surface' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const variantClasses = {
    ghost: 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-border)]',
    surface: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-surface-2)]',
    primary: 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-sm',
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
