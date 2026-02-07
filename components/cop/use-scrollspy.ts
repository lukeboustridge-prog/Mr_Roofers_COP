'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Scrollspy hook using IntersectionObserver
 *
 * Tracks which section is currently visible in the viewport and returns its ID.
 * Uses IntersectionObserver to efficiently monitor section visibility without scroll event listeners.
 *
 * @param sectionIds - Array of section IDs to observe (in DOM order)
 * @returns The ID of the currently active section
 */
export function useScrollspy(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Cleanup existing observer if sectionIds changed
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Track which sections are currently intersecting
    const intersecting = intersectingRef.current;
    intersecting.clear();

    // Create IntersectionObserver with viewport margins
    // rootMargin: '-20% 0px -75% 0px' means the intersection area is:
    // - Top: 20% from the top of viewport
    // - Bottom: 25% from the bottom of viewport
    // This triggers when a section enters the top 20% zone (more accurate for reading position)
    const observer = new IntersectionObserver(
      (entries) => {
        // Update intersecting set
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });

        // Find the topmost intersecting section by matching against sectionIds order
        if (intersecting.size > 0) {
          // Find first sectionId that is in the intersecting set (DOM order)
          const topmost = sectionIds.find((id) => intersecting.has(id));
          if (topmost) {
            setActiveId(topmost);
          }
        }
        // If no sections are intersecting, keep the last known activeId
        // (handles edge case where user scrolls very quickly past sections)
      },
      {
        rootMargin: '-20% 0px -75% 0px',
        threshold: 0,
      }
    );

    observerRef.current = observer;

    // Observe all section elements
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    // Cleanup on unmount or when sectionIds changes
    return () => {
      observer.disconnect();
      intersecting.clear();
    };
  }, [sectionIds]);

  return activeId;
}
