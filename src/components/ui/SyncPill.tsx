import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CloudOff, RefreshCw } from 'lucide-react';

export interface SyncPillProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount?: number;
  className?: string;
}

export const SyncPill: React.FC<SyncPillProps> = ({
  isOnline,
  isSyncing,
  pendingCount = 0,
  className = '',
}) => {
  const { t } = useTranslation();

  if (!isOnline) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300 select-none ${className}`}
      >
        <CloudOff className="w-3 h-3 shrink-0" />
        <span>{pendingCount > 0 ? `${pendingCount} pending offline` : t('app.sync.offline')}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 select-none ${className}`}
      >
        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
        <span>{t('app.sync.syncing')}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-[#E8F5E9] text-[var(--color-success)] border border-[#C8E6C9] select-none ${className}`}
    >
      <Check className="w-3 h-3 stroke-[2.5] shrink-0" />
      <span>{t('app.sync.synced')}</span>
    </div>
  );
};
