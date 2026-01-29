/**
 * Analytics utility for tracking user events.
 *
 * This provides a simple abstraction layer for analytics that can be
 * connected to any analytics provider (Google Analytics, PostHog, etc.)
 *
 * In development, events are logged to the console.
 * In production, events can be sent to your analytics provider.
 */

type EventProperties = Record<string, string | number | boolean | undefined>;

interface AnalyticsEvent {
  name: string;
  properties?: EventProperties;
  timestamp: number;
}

// Queue events if analytics isn't ready yet
const eventQueue: AnalyticsEvent[] = [];
let analyticsReady = false;

/**
 * Initialize analytics with your provider.
 * Call this in your root layout or _app file.
 */
export function initAnalytics(): void {
  // TODO: Initialize your analytics provider here
  // Example for Google Analytics:
  // if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
  //   gtag('config', process.env.NEXT_PUBLIC_GA_ID);
  // }

  analyticsReady = true;

  // Process queued events
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (event) {
      sendEvent(event);
    }
  }
}

/**
 * Track a custom event.
 */
export function trackEvent(name: string, properties?: EventProperties): void {
  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
  };

  if (analyticsReady) {
    sendEvent(event);
  } else {
    eventQueue.push(event);
  }
}

/**
 * Track a page view.
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    path,
    title: title || document.title,
  });
}

/**
 * Track when a user views a detail.
 */
export function trackDetailView(detailId: string, detailCode: string, source: string): void {
  trackEvent('detail_view', {
    detail_id: detailId,
    detail_code: detailCode,
    source,
  });
}

/**
 * Track when a user adds/removes a favorite.
 */
export function trackFavorite(detailId: string, action: 'add' | 'remove'): void {
  trackEvent('favorite', {
    detail_id: detailId,
    action,
  });
}

/**
 * Track search queries.
 */
export function trackSearch(query: string, resultCount: number, filters?: EventProperties): void {
  trackEvent('search', {
    query,
    result_count: resultCount,
    ...filters,
  });
}

/**
 * Track checklist actions.
 */
export function trackChecklist(
  action: 'create' | 'complete' | 'export',
  detailId: string,
  itemCount?: number
): void {
  trackEvent('checklist', {
    action,
    detail_id: detailId,
    item_count: itemCount,
  });
}

/**
 * Track 3D model interactions.
 */
export function track3DModel(action: 'load' | 'rotate' | 'zoom' | 'reset', detailId: string): void {
  trackEvent('3d_model', {
    action,
    detail_id: detailId,
  });
}

/**
 * Track errors for debugging.
 */
export function trackError(error: Error, context?: string): void {
  trackEvent('error', {
    message: error.message,
    name: error.name,
    context,
  });
}

/**
 * Internal: Send event to analytics provider.
 */
function sendEvent(event: AnalyticsEvent): void {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.name, event.properties);
    return;
  }

  // TODO: Send to your analytics provider
  // Example for Google Analytics:
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', event.name, event.properties);
  // }

  // Example for PostHog:
  // if (typeof posthog !== 'undefined') {
  //   posthog.capture(event.name, event.properties);
  // }
}

/**
 * React hook for tracking page views on route changes.
 * Use in your layout or _app file with usePathname.
 */
export function usePageTracking(pathname: string): void {
  if (typeof window !== 'undefined') {
    trackPageView(pathname);
  }
}
