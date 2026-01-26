'use client';

import { useEffect, useState } from 'react';
import { useOffline } from '@/hooks/useOffline';

interface StoreProviderProps {
  children: React.ReactNode;
}

// Component to initialize offline detection
function OfflineDetector() {
  useOffline();
  return null;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Return a loading skeleton or null during hydration
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineDetector />
      {children}
    </>
  );
}
