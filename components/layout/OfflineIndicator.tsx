'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { WifiOff, RefreshCw, X, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOffline, syncQueue, swUpdateAvailable } = useAppStore();
  const [dismissed, setDismissed] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  // Show sync status briefly when queue changes
  useEffect(() => {
    if (syncQueue.length > 0) {
      setShowSyncStatus(true);
      const timer = setTimeout(() => setShowSyncStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncQueue.length]);

  if (dismissed && !swUpdateAvailable) return null;

  // Update available banner
  if (swUpdateAvailable) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">
              A new version is available
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.location.reload()}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Update Now
          </Button>
        </div>
      </div>
    );
  }

  // Offline indicator
  if (isOffline) {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 shadow-lg transition-transform',
          dismissed ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              You&apos;re offline
              {syncQueue.length > 0 && (
                <span className="ml-2 text-amber-100">
                  ({syncQueue.length} pending {syncQueue.length === 1 ? 'action' : 'actions'})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-full p-1 hover:bg-amber-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Sync status indicator (when coming back online with queued items)
  if (showSyncStatus && syncQueue.length > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white px-4 py-2 shadow-lg">
        <div className="container mx-auto flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Syncing {syncQueue.length} pending {syncQueue.length === 1 ? 'action' : 'actions'}...
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// Compact offline badge for header/footer
export function OfflineBadge({ className }: { className?: string }) {
  const { isOffline } = useAppStore();

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800',
        className
      )}
    >
      <CloudOff className="h-3 w-3" />
      Offline
    </div>
  );
}
