'use client';

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
  // Initialize offline detection after mount
  // No hydration blocker - render children immediately for faster FCP
  // Zustand persist middleware handles state hydration asynchronously
  return (
    <>
      <OfflineDetector />
      {children}
    </>
  );
}
