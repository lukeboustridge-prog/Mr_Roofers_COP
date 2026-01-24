import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncQueueItem {
  id: string;
  action: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

interface CachedSubstrate {
  substrateId: string;
  cachedAt: number;
  detailCount: number;
}

interface AppState {
  // Mode
  mode: 'planner' | 'fixer';
  setMode: (mode: 'planner' | 'fixer') => void;

  // Fixer context
  fixerContext: {
    substrate: string | null;
    task: string | null;
  };
  setFixerContext: (context: { substrate?: string; task?: string }) => void;
  clearFixerContext: () => void;

  // User preferences (synced from DB when logged in)
  preferences: {
    windZone: string | null;
    corrosionZone: string | null;
    defaultSubstrate: string | null;
  };
  setPreferences: (prefs: Partial<AppState['preferences']>) => void;

  // Offline status
  isOffline: boolean;
  setOffline: (offline: boolean) => void;

  // Sync queue for offline actions
  syncQueue: SyncQueueItem[];
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => void;
  removeFromSyncQueue: (id: string) => void;
  clearSyncQueue: () => void;
  processSyncQueue: () => Promise<void>;

  // Cached substrates tracking
  cachedSubstrates: CachedSubstrate[];
  setCachedSubstrates: (substrates: CachedSubstrate[]) => void;
  addCachedSubstrate: (substrate: CachedSubstrate) => void;
  removeCachedSubstrate: (substrateId: string) => void;

  // Service worker status
  swRegistered: boolean;
  setSwRegistered: (registered: boolean) => void;
  swUpdateAvailable: boolean;
  setSwUpdateAvailable: (available: boolean) => void;

  // Sidebar state (desktop)
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mode: 'planner',
      setMode: (mode) => set({ mode }),

      fixerContext: { substrate: null, task: null },
      setFixerContext: (context) =>
        set((state) => ({
          fixerContext: { ...state.fixerContext, ...context }
        })),
      clearFixerContext: () =>
        set({ fixerContext: { substrate: null, task: null } }),

      preferences: {
        windZone: null,
        corrosionZone: null,
        defaultSubstrate: null,
      },
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs }
        })),

      isOffline: false,
      setOffline: (offline) => set({ isOffline: offline }),

      // Sync queue
      syncQueue: [],
      addToSyncQueue: (item) =>
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              retries: 0,
            },
          ],
        })),
      removeFromSyncQueue: (id) =>
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.id !== id),
        })),
      clearSyncQueue: () => set({ syncQueue: [] }),
      processSyncQueue: async () => {
        const { syncQueue, removeFromSyncQueue, isOffline } = get();

        if (isOffline || syncQueue.length === 0) return;

        for (const item of syncQueue) {
          try {
            const response = await fetch(item.url, {
              method: item.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });

            if (response.ok) {
              removeFromSyncQueue(item.id);
            } else if (item.retries >= 3) {
              // Remove after 3 retries
              removeFromSyncQueue(item.id);
              console.error('[SyncQueue] Failed after 3 retries:', item.action);
            } else {
              // Increment retry count
              set((state) => ({
                syncQueue: state.syncQueue.map((qi) =>
                  qi.id === item.id ? { ...qi, retries: qi.retries + 1 } : qi
                ),
              }));
            }
          } catch (error) {
            console.error('[SyncQueue] Error processing:', error);
          }
        }
      },

      // Cached substrates
      cachedSubstrates: [],
      setCachedSubstrates: (substrates) => set({ cachedSubstrates: substrates }),
      addCachedSubstrate: (substrate) =>
        set((state) => ({
          cachedSubstrates: [
            ...state.cachedSubstrates.filter(
              (s) => s.substrateId !== substrate.substrateId
            ),
            substrate,
          ],
        })),
      removeCachedSubstrate: (substrateId) =>
        set((state) => ({
          cachedSubstrates: state.cachedSubstrates.filter(
            (s) => s.substrateId !== substrateId
          ),
        })),

      // Service worker status
      swRegistered: false,
      setSwRegistered: (registered) => set({ swRegistered: registered }),
      swUpdateAvailable: false,
      setSwUpdateAvailable: (available) => set({ swUpdateAvailable: available }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'master-roofers-storage',
      partialize: (state) => ({
        mode: state.mode,
        preferences: state.preferences,
        syncQueue: state.syncQueue,
        cachedSubstrates: state.cachedSubstrates,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
