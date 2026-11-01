import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'md' | 'lg' | 'sm';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-sm gap-1.5',
    md: 'h-12 px-5 text-base gap-2',
    lg: 'h-14 px-6 text-lg font-semibold gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:opacity-95 shadow-sm active:bg-[#851628]',
    secondary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[#F2D6DB]',
    outline:
      'border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]',
    ghost:
      'text-[var(--color-text)] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-border)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 shadow-sm',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
