'use client';

import { useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  // Initialize offline detection
  useOffline();

  // Initialize service worker
  useServiceWorker();

  // Request persistent storage for better offline reliability
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const requestPersistentStorage = async () => {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const granted = await navigator.storage.persist();
          console.log(
            `[Storage] Persistent storage ${granted ? 'granted' : 'denied'}`
          );
        }
      }
    };

    requestPersistentStorage();
  }, []);

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
}
