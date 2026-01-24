// Master Roofers COP Service Worker
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const SUBSTRATE_CACHE_PREFIX = 'substrate-';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/planner',
  '/fixer',
  '/search',
  '/favourites',
  '/checklists',
  '/settings',
  '/manifest.json',
  '/offline.html',
];

// API routes to cache
const CACHEABLE_API_ROUTES = [
  '/api/substrates',
  '/api/categories',
  '/api/details',
  '/api/failures',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Keep substrate caches, remove old versioned caches
            if (name.startsWith(SUBSTRATE_CACHE_PREFIX)) {
              return false;
            }
            return (
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== API_CACHE
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Clerk and external auth requests
  if (
    url.hostname.includes('clerk') ||
    url.pathname.includes('__clerk')
  ) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (
    url.pathname.match(/\.(js|css|woff|woff2|png|jpg|jpeg|svg|ico|glb)$/)
  ) {
    // Static assets - Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/_next/')) {
    // Next.js assets - Cache first with network fallback
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  } else {
    // HTML pages - Network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// Cache first strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy - for API requests
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first - falling back to cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Network first with offline fallback - for HTML pages
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Page request failed, trying cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// Message handler for cache management
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_SUBSTRATE':
      await cacheSubstrateData(payload.substrateId, payload.data);
      event.ports[0]?.postMessage({ success: true });
      break;

    case 'GET_CACHED_SUBSTRATES':
      const substrates = await getCachedSubstrates();
      event.ports[0]?.postMessage({ substrates });
      break;

    case 'CLEAR_SUBSTRATE_CACHE':
      await clearSubstrateCache(payload.substrateId);
      event.ports[0]?.postMessage({ success: true });
      break;

    case 'GET_CACHE_SIZE':
      const size = await getCacheSize();
      event.ports[0]?.postMessage({ size });
      break;

    case 'SYNC_QUEUE':
      await processSyncQueue(payload.queue);
      event.ports[0]?.postMessage({ success: true });
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Cache substrate data for offline use
async function cacheSubstrateData(substrateId, data) {
  const cacheName = `${SUBSTRATE_CACHE_PREFIX}${substrateId}`;
  const cache = await caches.open(cacheName);

  // Cache the substrate details
  if (data.details) {
    for (const detail of data.details) {
      const detailRequest = new Request(`/api/details/${detail.id}`);
      const detailResponse = new Response(JSON.stringify(detail), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(detailRequest, detailResponse);

      // Cache 3D model if available
      if (detail.modelUrl) {
        try {
          const modelResponse = await fetch(detail.modelUrl);
          if (modelResponse.ok) {
            await cache.put(new Request(detail.modelUrl), modelResponse);
          }
        } catch (e) {
          console.warn('[SW] Failed to cache model:', detail.modelUrl);
        }
      }

      // Cache thumbnail if available
      if (detail.thumbnailUrl) {
        try {
          const thumbResponse = await fetch(detail.thumbnailUrl);
          if (thumbResponse.ok) {
            await cache.put(new Request(detail.thumbnailUrl), thumbResponse);
          }
        } catch (e) {
          console.warn('[SW] Failed to cache thumbnail:', detail.thumbnailUrl);
        }
      }
    }
  }

  // Store metadata about what's cached
  const metaRequest = new Request(`/substrate-cache-meta/${substrateId}`);
  const metaResponse = new Response(
    JSON.stringify({
      substrateId,
      cachedAt: Date.now(),
      detailCount: data.details?.length || 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  await cache.put(metaRequest, metaResponse);
}

// Get list of cached substrates
async function getCachedSubstrates() {
  const cacheNames = await caches.keys();
  const substrateCaches = cacheNames.filter((name) =>
    name.startsWith(SUBSTRATE_CACHE_PREFIX)
  );

  const substrates = [];
  for (const cacheName of substrateCaches) {
    const substrateId = cacheName.replace(SUBSTRATE_CACHE_PREFIX, '');
    const cache = await caches.open(cacheName);
    const metaRequest = new Request(`/substrate-cache-meta/${substrateId}`);
    const metaResponse = await cache.match(metaRequest);

    if (metaResponse) {
      const meta = await metaResponse.json();
      substrates.push(meta);
    }
  }

  return substrates;
}

// Clear substrate cache
async function clearSubstrateCache(substrateId) {
  const cacheName = `${SUBSTRATE_CACHE_PREFIX}${substrateId}`;
  await caches.delete(cacheName);
}

// Get total cache size (approximate)
async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usagePercent: estimate.quota
        ? Math.round((estimate.usage / estimate.quota) * 100)
        : 0,
    };
  }
  return { usage: 0, quota: 0, usagePercent: 0 };
}

// Process sync queue when back online
async function processSyncQueue(queue) {
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        console.warn('[SW] Sync failed for:', item.action);
      }
    } catch (error) {
      console.error('[SW] Sync error:', error);
    }
  }
}

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      // The sync queue will be processed via message from the client
      console.log('[SW] Background sync triggered')
    );
  }
});

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
