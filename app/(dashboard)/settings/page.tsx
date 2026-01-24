'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/app-store';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { WIND_ZONES, CORROSION_ZONES, SUBSTRATES } from '@/lib/constants';
import {
  Settings,
  Wind,
  Droplets,
  Layers,
  Download,
  Trash2,
  HardDrive,
  CloudOff,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { preferences, setPreferences, cachedSubstrates, isOffline, swRegistered } = useAppStore();
  const { cacheSubstrate, clearSubstrateCache, getCacheSize, refreshCachedSubstrates } = useServiceWorker();

  const [downloadingSubstrate, setDownloadingSubstrate] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cacheSize, setCacheSize] = useState<{ usage: number; quota: number; usagePercent: number }>({
    usage: 0,
    quota: 0,
    usagePercent: 0,
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch preferences from API on mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Only update if we got actual preferences from the server
            const serverPrefs = data.data;
            if (serverPrefs.windZone || serverPrefs.corrosionZone || serverPrefs.defaultSubstrate) {
              setPreferences({
                windZone: serverPrefs.windZone || preferences.windZone,
                corrosionZone: serverPrefs.corrosionZone || preferences.corrosionZone,
                defaultSubstrate: serverPrefs.defaultSubstrate || preferences.defaultSubstrate,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    }
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync preferences to API with debounce
  const syncPreferencesToServer = useCallback(async (prefs: typeof preferences) => {
    if (isOffline) return;

    setSyncStatus('syncing');

    try {
      const response = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (response.ok) {
        setSyncStatus('synced');
        // Reset to idle after 2 seconds
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Failed to sync preferences:', error);
      setSyncStatus('error');
    }
  }, [isOffline]);

  // Handle preference changes - update local state and sync to server
  const handlePreferenceChange = useCallback((newPrefs: Partial<typeof preferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(newPrefs);

    // Debounce the sync
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncPreferencesToServer(updatedPrefs);
    }, 500);
  }, [preferences, setPreferences, syncPreferencesToServer]);

  // Fetch cache size on mount
  const updateCacheSize = useCallback(async () => {
    const size = await getCacheSize();
    setCacheSize(size);
  }, [getCacheSize]);

  useEffect(() => {
    updateCacheSize();
    refreshCachedSubstrates();
  }, [updateCacheSize, refreshCachedSubstrates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const handleDownloadSubstrate = async (substrateId: string) => {
    if (isOffline) return;

    setDownloadingSubstrate(substrateId);
    setDownloadProgress(0);

    const success = await cacheSubstrate(substrateId, (progress) => {
      setDownloadProgress(progress);
    });

    if (success) {
      await updateCacheSize();
    }

    setDownloadingSubstrate(null);
    setDownloadProgress(0);
  };

  const handleClearSubstrate = async (substrateId: string) => {
    await clearSubstrateCache(substrateId);
    await updateCacheSize();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isSubstrateCached = (substrateId: string) => {
    return cachedSubstrates.some((s) => s.substrateId === substrateId);
  };

  const getCachedSubstrateInfo = (substrateId: string) => {
    return cachedSubstrates.find((s) => s.substrateId === substrateId);
  };

  return (
    <div className="container max-w-2xl p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-500" />
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Settings
          </h1>
        </div>
        <p className="mt-2 text-slate-600">
          Configure your preferences for contextual warnings
        </p>

        {/* Sync Status Indicator */}
        {syncStatus !== 'idle' && (
          <div className={cn(
            'flex items-center gap-2 text-sm mt-2 transition-opacity',
            syncStatus === 'syncing' && 'text-blue-600',
            syncStatus === 'synced' && 'text-green-600',
            syncStatus === 'error' && 'text-red-600'
          )}>
            {syncStatus === 'syncing' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {syncStatus === 'synced' && (
              <>
                <Cloud className="h-4 w-4" />
                <span>Preferences saved</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Failed to save (stored locally)</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6 mt-6">
        {/* Wind Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-blue-500" />
              Wind Zone
            </CardTitle>
            <CardDescription>
              Select your primary wind zone for relevant warnings (NZS 3604)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {WIND_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handlePreferenceChange({ windZone: zone.id })}
                  className={cn(
                    'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
                    preferences.windZone === zone.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="font-medium text-slate-900">{zone.name}</span>
                  <span className="text-sm text-slate-500">{zone.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Corrosion Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-teal-500" />
              Corrosion Zone
            </CardTitle>
            <CardDescription>
              Select your primary corrosion zone for material guidance (NZS 3604)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {CORROSION_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handlePreferenceChange({ corrosionZone: zone.id })}
                  className={cn(
                    'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
                    preferences.corrosionZone === zone.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="font-medium text-slate-900">{zone.name}</span>
                  <span className="text-sm text-slate-500">{zone.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Default Substrate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Default Substrate
            </CardTitle>
            <CardDescription>
              Set your most commonly used substrate type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUBSTRATES.map((substrate) => (
                <button
                  key={substrate.id}
                  onClick={() => handlePreferenceChange({ defaultSubstrate: substrate.id })}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    preferences.defaultSubstrate === substrate.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="font-medium text-slate-900">{substrate.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offline Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudOff className="h-5 w-5 text-orange-500" />
              Offline Data
            </CardTitle>
            <CardDescription>
              Download substrate packages for offline access on-site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Worker Status */}
            {!swRegistered && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Offline mode not available
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your browser may not support service workers, or you&apos;re in a private window.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Usage */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Storage Used</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={updateCacheSize}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={cacheSize.usagePercent} className="h-2 mb-2" />
              <p className="text-xs text-slate-500">
                {formatBytes(cacheSize.usage)} of {formatBytes(cacheSize.quota)} ({cacheSize.usagePercent}%)
              </p>
            </div>

            {/* Substrate Downloads */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Substrate Packages</p>
              {SUBSTRATES.map((substrate) => {
                const isCached = isSubstrateCached(substrate.id);
                const cachedInfo = getCachedSubstrateInfo(substrate.id);
                const isDownloading = downloadingSubstrate === substrate.id;

                return (
                  <div
                    key={substrate.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      isCached ? 'bg-green-50 border-green-200' : 'bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            isCached ? 'bg-green-100' : 'bg-slate-100'
                          )}
                        >
                          {isCached ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Download className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {substrate.name}
                          </p>
                          {isCached && cachedInfo && (
                            <p className="text-xs text-slate-500">
                              {cachedInfo.detailCount} details cached
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCached ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearSubstrate(substrate.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSubstrate(substrate.id)}
                            disabled={isDownloading || isOffline || !swRegistered}
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                {downloadProgress}%
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {isDownloading && (
                      <Progress value={downloadProgress} className="h-1 mt-3" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Offline Tips */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Download your most-used substrate packages before heading to site.
                Cached data includes all details, specifications, and 3D models.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Summary */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preferences.windZone && (
                <Badge variant="secondary">
                  <Wind className="mr-1 h-3 w-3" />
                  {WIND_ZONES.find((z) => z.id === preferences.windZone)?.name || 'Unknown'} Wind
                </Badge>
              )}
              {preferences.corrosionZone && (
                <Badge variant="secondary">
                  <Droplets className="mr-1 h-3 w-3" />
                  Corrosion Zone {preferences.corrosionZone.toUpperCase()}
                </Badge>
              )}
              {preferences.defaultSubstrate && (
                <Badge variant="secondary">
                  <Layers className="mr-1 h-3 w-3" />
                  {SUBSTRATES.find((s) => s.id === preferences.defaultSubstrate)?.name || 'Unknown'}
                </Badge>
              )}
              {!preferences.windZone && !preferences.corrosionZone && !preferences.defaultSubstrate && (
                <span className="text-sm text-slate-500">No preferences set</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => handlePreferenceChange({
              windZone: null,
              corrosionZone: null,
              defaultSubstrate: null,
            })}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
