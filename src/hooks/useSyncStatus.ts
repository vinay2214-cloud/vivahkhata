import { useState, useEffect } from 'react';
import { useOnline } from './useOnline';

export function useSyncStatus() {
  const isOnline = useOnline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);

  useEffect(() => {
    // When returning online, briefly indicate syncing
    if (isOnline) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setPendingWrites(0);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    pendingWrites,
    recordLocalWrite: () => setPendingWrites((p) => p + 1),
  };
}
