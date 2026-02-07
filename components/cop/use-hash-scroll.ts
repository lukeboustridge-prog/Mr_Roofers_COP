'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hash scroll polyfill for Next.js App Router
 *
 * Next.js App Router has known issues with hash-based scrolling on navigation.
 * This hook ensures hash anchors work correctly for both:
 * - Hard navigation (direct URL entry)
 * - Client-side Link navigation
 */
export function useHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          // Delay to ensure DOM is ready
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    // Scroll on mount and pathname change
    scrollToHash();

    // Listen for hash changes (same-page navigation)
    const handleHashChange = () => {
      scrollToHash();
    };

    window.addEventListener('hashchange', handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);
}
