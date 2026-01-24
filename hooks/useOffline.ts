'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

export function useOffline() {
  const { isOffline, setOffline } = useAppStore();

  useEffect(() => {
    // Set initial state
    setOffline(!navigator.onLine);

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  return isOffline;
}
