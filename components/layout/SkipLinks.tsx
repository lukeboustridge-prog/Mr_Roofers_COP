'use client';

/**
 * Skip links for keyboard accessibility.
 * These links are only visible when focused, allowing keyboard users
 * to skip directly to main content or navigation.
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-[100] bg-primary text-white px-4 py-2 font-medium focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <a
        href="#search-input"
        className="fixed top-0 left-40 z-[100] bg-primary text-white px-4 py-2 font-medium focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to search
      </a>
      <a
        href="#navigation"
        className="fixed top-0 left-72 z-[100] bg-primary text-white px-4 py-2 font-medium focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to navigation
      </a>
    </div>
  );
}
