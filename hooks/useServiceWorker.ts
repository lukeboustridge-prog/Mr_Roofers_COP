'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';

export function useServiceWorker() {
  const {
    setSwRegistered,
    setSwUpdateAvailable,
    isOffline,
    syncQueue,
    processSyncQueue,
    setCachedSubstrates,
  } = useAppStore();

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[SW] Registered successfully');
        setSwRegistered(true);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                setSwUpdateAvailable(true);
              }
            });
          }
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page to use the new service worker
          window.location.reload();
        });

        // Fetch cached substrates from SW
        await refreshCachedSubstrates();
      } catch (error) {
        console.error('[SW] Registration failed:', error);
        setSwRegistered(false);
      }
    };

    registerSW();
  }, [setSwRegistered, setSwUpdateAvailable]);

  // Process sync queue when coming back online
  useEffect(() => {
    if (!isOffline && syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [isOffline, syncQueue.length, processSyncQueue]);

  // Refresh cached substrates list
  const refreshCachedSubstrates = useCallback(async () => {
    if (!navigator.serviceWorker.controller) return;

    try {
      const messageChannel = new MessageChannel();
      const response = await new Promise<{ substrates: Array<{
        substrateId: string;
        cachedAt: number;
        detailCount: number;
      }> }>((resolve) => {
        messageChannel.port1.onmessage = (event) => resolve(event.data);
        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHED_SUBSTRATES' },
          [messageChannel.port2]
        );
      });

      setCachedSubstrates(response.substrates || []);
    } catch (error) {
      console.error('[SW] Failed to get cached substrates:', error);
    }
  }, [setCachedSubstrates]);

  // Cache a substrate for offline use
  const cacheSubstrate = useCallback(
    async (
      substrateId: string,
      onProgress?: (progress: number) => void
    ): Promise<boolean> => {
      if (!navigator.serviceWorker.controller) {
        console.error('[SW] No active service worker');
        return false;
      }

      try {
        // Fetch complete substrate data from offline API
        onProgress?.(10);

        const response = await fetch(`/api/offline/substrate/${substrateId}`);
        if (!response.ok) throw new Error('Failed to fetch substrate data');

        const { data } = await response.json();
        onProgress?.(50);

        // Send to service worker for caching
        const messageChannel = new MessageChannel();
        await new Promise<{ success: boolean }>((resolve) => {
          messageChannel.port1.onmessage = (event) => resolve(event.data);
          navigator.serviceWorker.controller?.postMessage(
            {
              type: 'CACHE_SUBSTRATE',
              payload: { substrateId, data },
            },
            [messageChannel.port2]
          );
        });

        onProgress?.(100);

        // Refresh the cached substrates list
        await refreshCachedSubstrates();

        return true;
      } catch (error) {
        console.error('[SW] Failed to cache substrate:', error);
        return false;
      }
    },
    [refreshCachedSubstrates]
  );

  // Clear cached substrate
  const clearSubstrateCache = useCallback(
    async (substrateId: string): Promise<boolean> => {
      if (!navigator.serviceWorker.controller) return false;

      try {
        const messageChannel = new MessageChannel();
        await new Promise<{ success: boolean }>((resolve) => {
          messageChannel.port1.onmessage = (event) => resolve(event.data);
          navigator.serviceWorker.controller?.postMessage(
            { type: 'CLEAR_SUBSTRATE_CACHE', payload: { substrateId } },
            [messageChannel.port2]
          );
        });

        await refreshCachedSubstrates();
        return true;
      } catch (error) {
        console.error('[SW] Failed to clear substrate cache:', error);
        return false;
      }
    },
    [refreshCachedSubstrates]
  );

  // Get cache size
  const getCacheSize = useCallback(async () => {
    if (!navigator.serviceWorker.controller) {
      return { usage: 0, quota: 0, usagePercent: 0 };
    }

    try {
      const messageChannel = new MessageChannel();
      const response = await new Promise<{
        size: { usage: number; quota: number; usagePercent: number };
      }>((resolve) => {
        messageChannel.port1.onmessage = (event) => resolve(event.data);
        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      });

      return response.size;
    } catch (error) {
      console.error('[SW] Failed to get cache size:', error);
      return { usage: 0, quota: 0, usagePercent: 0 };
    }
  }, []);

  // Skip waiting for new service worker
  const skipWaiting = useCallback(() => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  return {
    cacheSubstrate,
    clearSubstrateCache,
    getCacheSize,
    refreshCachedSubstrates,
    skipWaiting,
  };
}
