---
phase: 15-navigation-chrome
plan: 02
subsystem: ui
tags: [nextjs, react, intersection-observer, scrollspy, toc, navigation, shadcn-ui, client-components]

# Dependency graph
requires:
  - phase: 15-01
    provides: Section deep-linking, breadcrumb navigation, useHashScroll hook, SectionRenderer with section IDs
provides:
  - Desktop TOC sidebar with sticky positioning and scrollspy highlighting
  - Mobile TOC drawer accessed via floating "Contents" button
  - IntersectionObserver-based scrollspy hook tracking active section
  - Recursive TOCTree component with auto-scroll to active item
  - ChapterContent client wrapper handling all interactive navigation
affects: [Phase 16 (Search), Phase 17 (Offline PWA)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client/Server Component boundary pattern (Server Component page passes data to Client Component wrapper)
    - IntersectionObserver for scroll tracking (no scroll event listeners)
    - Recursive component pattern for nested TOC hierarchy
    - Sheet drawer for mobile navigation

key-files:
  created:
    - components/cop/use-scrollspy.ts
    - components/cop/TOCTree.tsx
    - components/cop/ChapterContent.tsx
  modified:
    - app/(dashboard)/cop/[chapterNumber]/page.tsx

key-decisions:
  - "IntersectionObserver rootMargin '-20% 0px -75% 0px' for accurate scroll position tracking (top 20% of viewport)"
  - "Client/Server split: Server Component handles filesystem reads and redirects, Client Component handles all UI"
  - "TOC sidebar auto-scrolls active item into view with scrollIntoView({ behavior: 'smooth', block: 'nearest' })"
  - "Mobile drawer closes on TOC item click via onItemClick callback"

patterns-established:
  - "Scrollspy pattern: IntersectionObserver with Set tracking + DOM-order matching for active section"
  - "Recursive TOC rendering with level-based indentation (ml-3 per level) and text sizing (text-sm for levels 0-2, text-xs for 3+)"
  - "Client Component wrapper pattern: Server Component passes full data object to client boundary"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 15 Plan 02: TOC Sidebar with Scrollspy Summary

**Desktop sticky TOC sidebar with IntersectionObserver scrollspy, mobile Sheet drawer, and client/server boundary refactor**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T12:50:16Z
- **Completed:** 2026-02-08T12:54:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Desktop users see sticky TOC sidebar on left with full chapter hierarchy
- Scrollspy highlights currently visible section as user scrolls through content
- Mobile users access same TOC via floating "Contents" button opening slide-out drawer
- TOC auto-scrolls to keep active section visible
- Clean client/server boundary separation for optimal performance

## Task Commits

Each task was committed atomically:

1. **Task 1: Scrollspy hook and TOC tree component** - `e23e76b` (feat)
2. **Task 2: ChapterContent client wrapper with sidebar, drawer, and page integration** - `59f489d` (feat)

## Files Created/Modified
- `components/cop/use-scrollspy.ts` - IntersectionObserver hook tracking visible section in viewport
- `components/cop/TOCTree.tsx` - Recursive TOC component with active highlighting and auto-scroll
- `components/cop/ChapterContent.tsx` - Client wrapper with desktop sidebar, mobile drawer, scrollspy, and hash scroll
- `app/(dashboard)/cop/[chapterNumber]/page.tsx` - Server Component refactored to pass data to ChapterContent

## Decisions Made

**IntersectionObserver configuration:**
- rootMargin `-20% 0px -75% 0px` provides accurate active section tracking (top 20% zone)
- threshold 0 fires as soon as section crosses boundary
- Track intersecting sections in Set, find topmost by DOM order

**Client/Server boundary:**
- Page remains Server Component (reads JSON from filesystem, handles redirects)
- ChapterContent is client boundary receiving full chapterData
- Breadcrumbs (Server Component) rendered inside Client Component works because it has no server-only dependencies

**Mobile drawer UX:**
- onItemClick callback closes drawer after navigation
- Sheet side="left" for natural reading direction
- Drawer shows chapter title in header for context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - IntersectionObserver API worked as expected, Sheet component integrated smoothly, and client/server boundary refactor completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 15 complete:** All navigation chrome requirements satisfied.
- NAV-01: Deep-linking to sections ✓ (Plan 15-01)
- NAV-02: TOC sidebar (desktop) and drawer (mobile) ✓ (Plan 15-02)
- NAV-03: Scrollspy highlighting ✓ (Plan 15-02)
- NAV-04: Breadcrumb navigation ✓ (Plan 15-01)
- NAV-05: Service Worker cache ✓ (Plan 15-01)

**Ready for Phase 16 (Search):** Navigation chrome provides solid foundation for adding search functionality.

**Technical notes for future phases:**
- IntersectionObserver works well, but 100ms delay in useHashScroll may be insufficient on slow devices - consider requestAnimationFrame pattern if issues arise
- Chapter 19 (618 KB) may benefit from pagination in future optimization phase
- TOC sidebar fixed at 288px (w-72) - works well for COP section numbers up to 3 levels deep

---
*Phase: 15-navigation-chrome*
*Completed: 2026-02-08*
