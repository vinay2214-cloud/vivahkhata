import React from 'react';

const PALETTE = [
  '#9B1C31', // Kumkum
  '#D99A1E', // Turmeric
  '#2E7D4F', // Mango leaf
  '#3B6EA8',
  '#8E5BA8',
  '#C65D2E',
  '#5A8F8B',
];

export interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, photoURL, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold',
  };

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover border border-[var(--color-border)] ${className}`}
      />
    );
  }

  // Generate deterministic color based on name characters
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = PALETTE[Math.abs(hash) % PALETTE.length];

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      style={{ backgroundColor: color }}
      className={`rounded-full flex items-center justify-center text-white font-semibold select-none shadow-xs shrink-0 ${sizeMap[size]} ${className}`}
    >
      {initials || '?'}
    </div>
  );
};
