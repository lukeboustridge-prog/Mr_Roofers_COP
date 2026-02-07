---
phase: 15-navigation-chrome
plan: 01
subsystem: cop-reader-ui
tags: [navigation, deep-linking, breadcrumbs, service-worker, offline]
requires:
  - 14-02 # Recursive section renderer (provides section IDs for hash anchors)
provides:
  - Section deep-link routing (/cop/8.5.4 redirects to /cop/8#section-8.5.4)
  - Hash scroll polyfill hook (useHashScroll)
  - Breadcrumb navigation component
  - Updated service worker (v2 cache, /cop route, JSON caching)
affects:
  - 15-02 # Scrollspy navigation will consume useHashScroll hook
  - 16-* # Search results can link to sections via deep-link URLs
tech-stack:
  added: []
  patterns:
    - Next.js Server Component redirect handling for nested routes
    - Hash scroll polyfill with usePathname + hashchange event
    - Responsive breadcrumbs (mobile-first, hide intermediate levels)
key-files:
  created:
    - components/cop/use-hash-scroll.ts # Client-side hash scroll polyfill
    - components/cop/Breadcrumbs.tsx # Hierarchical breadcrumb navigation
  modified:
    - app/(dashboard)/cop/[chapterNumber]/page.tsx # Deep-link detection and redirect logic
    - public/sw.js # Cache version v2, added /cop route and .json extension
decisions:
  - id: DEC-15-01-A
    title: Single dynamic route for chapters and sections
    context: Next.js cannot have two dynamic segments at the same path level
    decision: Detect dot-containing params in [chapterNumber] route to handle both chapter numbers (1-19) and section numbers (8.5.4)
    alternatives:
      - Create separate [sectionNumber] route (conflicts with [chapterNumber])
      - Use catch-all route [[...slug]] (breaks existing chapter route structure)
    rationale: Simplest solution, preserves existing route structure, validates section exists before redirecting
  - id: DEC-15-01-B
    title: Server-side breadcrumbs only show chapter level
    context: Hash-based section navigation happens client-side, Server Components cannot read window.location.hash
    decision: Breadcrumbs on chapter page show "COP > Chapter N: Title" only. Full section hierarchy breadcrumbs will be added client-side with scrollspy in Plan 15-02.
    alternatives:
      - Make Breadcrumbs a Client Component (loses SSR benefits)
      - Duplicate breadcrumb logic for client-side updates (adds complexity)
    rationale: Progressive enhancement -- basic breadcrumbs work on initial load, enhanced breadcrumbs added with JavaScript
metrics:
  duration: 6min
  completed: 2026-02-08
---

# Phase 15 Plan 01: Section Deep-Linking and Breadcrumb Navigation Summary

**One-liner:** Section deep-link routing with hash scroll polyfill, hierarchical breadcrumbs, and service worker v2 cache for offline COP access.

## What Was Built

### Task 1: Deep-link route, hash scroll hook, and service worker update
- **Modified** `app/(dashboard)/cop/[chapterNumber]/page.tsx` to detect section numbers (params containing dots)
- Section numbers are validated against chapter JSON data using recursive `findSection` helper
- Valid sections redirect to chapter page with hash anchor: `/cop/8.5.4` → `/cop/8#section-8.5.4`
- Invalid sections (chapter doesn't exist or section not found) return 404
- **Created** `components/cop/use-hash-scroll.ts` hook as Next.js App Router hash scroll polyfill
  - Listens for pathname changes and hashchange events
  - Scrolls to hash anchors with smooth behavior and 100ms delay for DOM readiness
  - Cleanup on unmount to prevent memory leaks
- **Updated** `public/sw.js` service worker:
  - CACHE_VERSION bumped from `v1` to `v2` (triggers cache refresh on deploy)
  - Added `/cop` to STATIC_ASSETS array (COP grid index page)
  - Added `json` to cached file extension regex (enables chapter JSON caching)

**Commit:** `f78649d` - feat(15-01): implement section deep-linking with hash scroll polyfill and service worker updates

### Task 2: Breadcrumb component and chapter page integration
- **Created** `components/cop/Breadcrumbs.tsx` Server Component
  - `buildBreadcrumbs` function generates hierarchy based on CopChapter data
  - Chapter-level pages show "COP > Chapter N: Title"
  - Section-level (future enhancement) will show full path: "COP > Chapter N > 8.5 Title > 8.5.4 Title"
  - Responsive design: hides middle breadcrumbs on mobile (`hidden sm:flex`)
  - Semantic markup: `<nav aria-label="Breadcrumb">` with `<ol>` list
  - Current page item uses `aria-current="page"` for accessibility
- **Integrated** breadcrumbs into chapter page between "Back to COP" link and chapter header
- Separator icons: ChevronRight (lucide-react, h-3 w-3, text-slate-400)

**Commit:** `7325df0` - feat(15-01): add breadcrumb navigation to chapter pages

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Route Conflict Resolution
Next.js dynamic routes at the same path level conflict (e.g., `[chapterNumber]` and `[sectionNumber]` cannot coexist). Solution: Single `[chapterNumber]` route handles both cases by detecting dots in param. Chapter numbers (1-19) are plain integers, section numbers (8.5.4) contain dots.

### Hash Scroll Reliability
Next.js App Router has known issues with hash-based scrolling on client-side navigation. The `useHashScroll` hook works around this by:
1. Running `scrollIntoView` on mount and pathname change (catches hard navigation)
2. Listening for `hashchange` events (catches same-page hash changes)
3. Using 100ms setTimeout to ensure DOM elements are rendered before scrolling

### Service Worker Cache Strategy
- `/cop` route cached immediately on install (STATIC_ASSETS)
- `/cop/[chapterNumber]` pages cached dynamically via `networkFirstWithOfflineFallback` (HTML strategy)
- `/cop/chapter-*.json` files cached by `cacheFirstStrategy` (matches `json` extension)
- Cache version bump (`v2`) triggers automatic cleanup of old caches on activate event

## Requirements Satisfied

| Req ID | Requirement | Status |
|--------|-------------|--------|
| COPR-03 | User can navigate to any section via URL containing section number | ✅ Complete |
| NAV-01 | Breadcrumb trail shows hierarchy | 🟡 Partial (chapter-level only, section-level in Plan 15-02) |
| Offline-01 | COP routes cached for offline access | ✅ Complete |

## Test Coverage

### Manual Verification Needed
- [ ] Navigate to `/cop/8.5.4` → redirects to `/cop/8#section-8.5.4`
- [ ] Navigate to `/cop/99.9` → returns 404 (invalid chapter)
- [ ] Navigate to `/cop/8.99.99` → returns 404 (invalid section)
- [ ] Hash scroll works on hard navigation (enter URL in browser)
- [ ] Hash scroll works on Link navigation (click within app)
- [ ] Breadcrumbs render "COP > Chapter 8: Steel Roofing" on chapter pages
- [ ] COP link in breadcrumbs navigates to `/cop`
- [ ] Current chapter breadcrumb shows as non-link text
- [ ] Service worker updates to v2 on page reload
- [ ] Chapter JSON files cached after first load (verify in DevTools → Application → Cache Storage)

### TypeScript Compilation
✅ Passes (no errors in modified files; pre-existing error in `lib/db/link-cop-section-details.ts` unrelated to this plan)

## Next Phase Readiness

### Blockers
None.

### Concerns
- **Hash scroll timing:** 100ms delay may be insufficient on slow devices. If scrolling fails, increase timeout or use `requestAnimationFrame` + double-raf pattern.
- **Breadcrumb truncation:** Current mobile truncation hides middle items. Consider showing "..." ellipsis or dropdown for deep hierarchies (future enhancement).

### Recommendations
1. **Plan 15-02 (Scrollspy):** Wire `useHashScroll` hook into chapter page client boundary for active section tracking
2. **Plan 16-* (Search):** Use section deep-link format (`/cop/8.5.4`) in search result hrefs for direct navigation
3. **Testing:** Add E2E tests for deep-link redirect flow and hash scroll behavior

## Files Changed

**Created:**
- `components/cop/use-hash-scroll.ts` (45 lines) - Hash scroll polyfill hook
- `components/cop/Breadcrumbs.tsx` (117 lines) - Breadcrumb navigation component

**Modified:**
- `app/(dashboard)/cop/[chapterNumber]/page.tsx` (+29 lines) - Deep-link detection, redirect logic, findSection helper
- `public/sw.js` (2 lines) - Cache version bump, /cop route, json extension

**Total:** +191 lines added, 2 lines modified, 2 new files

## Decisions Made

See frontmatter `decisions` section for full details.

**Key Decision:** Single dynamic route pattern for both chapters and sections (DEC-15-01-A) avoids Next.js route conflicts and preserves existing URL structure. Server-side breadcrumbs show chapter-level only (DEC-15-01-B), with client-side enhancement planned for Plan 15-02.

## Commit History

- `f78649d` - feat(15-01): implement section deep-linking with hash scroll polyfill and service worker updates
- `7325df0` - feat(15-01): add breadcrumb navigation to chapter pages

**Duration:** 6 minutes
**Tasks completed:** 2/2
**Plans complete in Phase 15:** 1/2
