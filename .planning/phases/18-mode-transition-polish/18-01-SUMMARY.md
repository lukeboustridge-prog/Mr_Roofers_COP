---
phase: 18-mode-transition-polish
plan: 01
subsystem: navigation
tags: [navigation, mode-transition, cop-reader, service-worker, pwa]
requires:
  - 15-01 # COP Reader routes (/cop/[chapterNumber])
  - 15-02 # COP scrollspy TOC
  - 17-02 # HTG supplementary content
provides:
  - Primary navigation surfaces point to COP Reader (/cop)
  - Service worker v3 cache refresh
  - Path-aware navigation highlighting
affects:
  - Future analytics (track COP Reader vs Fixer usage patterns)
tech-stack:
  added: []
  patterns:
    - Path prefix matching for active nav states
    - Service worker versioning for cache invalidation
key-files:
  created: []
  modified:
    - app/(dashboard)/page.tsx
    - components/layout/Sidebar.tsx
    - components/layout/MobileNav.tsx
    - public/sw.js
decisions:
  - id: NAV-01
    desc: "COP Reader is primary Planner navigation, /planner routes preserved for backward compat"
    rationale: "Additive transition - no breaking changes to existing substrate/category/detail routes"
  - id: NAV-02
    desc: "Dashboard card changed from Clipboard to BookOpen icon, description updated to reflect COP content"
    rationale: "Visual consistency with chapter-based browsing (books = chapters)"
  - id: NAV-03
    desc: "Sidebar uses path prefix matching (pathname.startsWith(item.href + '/')) for /cop/* routes"
    rationale: "Ensures COP Reader nav item highlights when viewing /cop/1, /cop/8, etc."
  - id: SW-01
    desc: "Service worker version bumped to v3"
    rationale: "Forces browser cache refresh to load updated HTML with new navigation links"
duration: 3min
completed: 2026-02-08
---

# Phase 18 Plan 01: Mode Transition - Primary Navigation Update

> Navigate Planner mode to COP Reader (/cop) across dashboard, sidebar, and mobile surfaces

## One-liner
Dashboard, sidebar, and mobile navigation now point Planner mode at /cop (COP Reader) with BookOpen icon and chapter-based messaging, service worker v3 triggers cache refresh.

## What Was Built

### Task 1: Navigation Link Updates
Updated all primary Planner mode navigation surfaces to point to `/cop` instead of `/planner`:

**Dashboard (app/(dashboard)/page.tsx):**
- Planner mode card href changed from `/planner` to `/cop`
- Icon changed from `Clipboard` to `BookOpen`
- Card description updated to "Browse COP by Chapter"
- Card body text updated to emphasize chapter browsing and supplementary guides
- Badges changed to "19 Chapters", "Technical Diagrams", "HTG Guides"
- "Browse all" link in Recently Viewed header changed to `/cop`
- Empty-state "Browse Details" buttons in Recently Viewed and Favourites changed to `/cop`
- **Preserved**: Detail deep-links remain at `/planner/${substrateId}/${categoryId}/${detailId}` (lines 304, 365)
- **Preserved**: Fixer mode card unchanged at `/fixer`

**Desktop Sidebar (components/layout/Sidebar.tsx):**
- Main nav item changed from `{ href: '/planner', label: 'Planner', icon: Clipboard }` to `{ href: '/cop', label: 'COP Reader', icon: BookOpen }`
- Removed `Clipboard` from imports (no longer used)
- Added `BookOpen` to imports
- Enhanced active state logic: `item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')`
  - Home uses exact match to avoid always being active
  - COP Reader highlights when pathname is `/cop`, `/cop/1`, `/cop/8.5.4`, etc.
- **Preserved**: Substrates accordion still links to `/planner/${substrate.id}` (will be updated in Plan 18-02)

**Mobile Navigation (components/layout/MobileNav.tsx):**
- Main nav item changed from `{ href: '/planner', label: 'Planner Mode', icon: Clipboard, ... }` to `{ href: '/cop', label: 'COP Reader', icon: BookOpen, ... }`
- Added `BookOpen` to imports
- **Preserved**: `Clipboard` kept in imports (used in mode indicator section at bottom of sheet)
- **Preserved**: Fixer Mode item unchanged at `/fixer`
- **Preserved**: Mode indicator section at bottom (lines 168-185) correctly uses `Clipboard` icon for planner mode state

### Task 2: Service Worker Cache Version Bump
Updated `public/sw.js`:
- `CACHE_VERSION` changed from `'v2'` to `'v3'`
- This triggers cache invalidation on next service worker activation
- Old v2 caches (which have stale HTML pointing to `/planner`) will be deleted
- New v3 caches will store updated HTML pointing to `/cop`
- **Preserved**: Both `/cop` and `/planner` remain in `STATIC_ASSETS` array for backward compatibility

## Verification Results

All verification steps from plan passed:

1. ✅ `npx next build` completed successfully (TypeScript compilation passed)
2. ✅ No `href="/planner"` in Sidebar.tsx (confirmed via grep)
3. ✅ No `href="/planner"` in MobileNav.tsx (confirmed via grep)
4. ✅ Dashboard page.tsx has `/planner/` only in detail deep-links (lines 304, 365) - mode card and browse links updated to `/cop`
5. ✅ sw.js has `CACHE_VERSION = 'v3'`
6. ✅ Both `/cop` and `/planner` remain in STATIC_ASSETS
7. ✅ All `/fixer` links unchanged across all files
8. ✅ `BookOpen` imported and used in Sidebar.tsx
9. ✅ `BookOpen` imported and used in MobileNav.tsx
10. ✅ "COP Reader" label present in Sidebar.tsx (line 24)
11. ✅ "COP Reader" label present in MobileNav.tsx (line 86)

**Build output:**
- TypeScript compilation: ✅ Compiled successfully
- ESLint warnings: Pre-existing issues in unrelated files (see Deviations)

## Deviations from Plan

### Pre-existing ESLint Warnings (Not Blocking)
**Found during:** Build verification (Task 1)

**Issues:** ESLint warnings in files not modified by this plan:
- `components/cop/CopImage.tsx`: Unused `cn` import
- `lib/db/link-cop-section-details.ts`: Unused imports, `any` types
- `lib/db/map-htg-to-cop.ts`: Unused `and` import

**Decision:** Did not fix - these are technical debt from Phase 17, not introduced by this plan. Documented here for future cleanup.

**Rationale:**
- TypeScript compilation succeeded ("✓ Compiled successfully")
- Errors are linting warnings, not type errors
- Issues exist in unrelated files (COP image rendering, database migration scripts)
- Fixing would expand scope beyond mode transition
- Plan objective (update navigation surfaces) achieved without touching these files

**Recommendation:** Address in dedicated tech debt cleanup task (Plan 18-03 or post-v1.2)

### Import Cleanup (Auto-fixed)
**Found during:** First build attempt (Task 1)

**Issue:** `Clipboard` import in `app/(dashboard)/page.tsx` unused after icon change to `BookOpen`

**Fix:** Removed `Clipboard` from lucide-react import statement

**Commit:** Included in main feat(18-01) commit

**Rationale:** Rule 1 (auto-fix bugs) - unused imports are technical correctness issues, fixed immediately.

## Key Decisions Made

1. **Path prefix matching for active states** (NAV-03)
   - COP Reader nav highlights for `/cop`, `/cop/1`, `/cop/8`, etc.
   - Home nav uses exact match to avoid always being active
   - Pattern: `item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')`

2. **Preserved detail deep-links** (NAV-01)
   - `/planner/${substrateId}/${categoryId}/${detailId}` links remain in Recently Viewed and Favourites
   - These are substrate-navigation deep links, separate from primary mode navigation
   - Will be re-evaluated in Plan 18-02 (substrate navigation updates)

3. **Service worker v3 activation** (SW-01)
   - Immediate activation via `skipWaiting()` and `clients.claim()` (already present)
   - Users get updated navigation on next page load
   - Old v2 caches cleaned up automatically

## Testing Recommendations

**Manual verification (user testing):**
1. Dashboard:
   - Click Planner mode card → should navigate to `/cop`
   - Verify icon is BookOpen (book icon)
   - Verify description reads "Browse COP by Chapter"
   - Click "Browse all" in Recently Viewed → should navigate to `/cop`
   - Click "Browse Details" in empty states → should navigate to `/cop`
2. Desktop Sidebar:
   - Verify "COP Reader" label with BookOpen icon
   - Navigate to `/cop` → COP Reader should highlight
   - Navigate to `/cop/1` → COP Reader should stay highlighted
   - Navigate to `/` → Only Home should highlight (not COP Reader)
3. Mobile Navigation:
   - Open slide-out menu (tap "Menu" in bottom bar)
   - Verify "COP Reader" label with BookOpen icon
   - Verify Fixer Mode still present and unchanged
   - Verify mode indicator at bottom shows "Planner" with Clipboard icon when in planner mode
4. Service Worker:
   - Check browser DevTools → Application → Service Workers
   - Verify version v3 is active
   - Clear site data and reload → verify caching works

**Regression testing:**
- Verify Fixer mode card still links to `/fixer`
- Verify Fixer sidebar/mobile nav items unchanged
- Verify detail deep-links in Recently Viewed/Favourites still work
- Verify substrate accordion in sidebar still functional (even if linking to old `/planner/${id}`)

## Next Phase Readiness

**Blockers:** None

**Recommended next steps:**
1. **Plan 18-02**: Update substrate navigation (sidebar accordion, substrate detail pages) to use COP Reader where appropriate
2. **User testing**: Validate new navigation flow with 2-3 users before moving forward
3. **Analytics**: Add tracking to measure COP Reader vs substrate navigation usage

**Questions for stakeholders:**
- Should the substrates accordion in sidebar be removed (since COP Reader doesn't use substrates)?
- Should substrate landing pages (`/planner/${substrateId}`) redirect to COP Reader?
- Are there other entry points to `/planner` that need updating (external links, docs, tutorials)?

## Files Modified

| File | Lines Changed | Change Type |
|------|---------------|-------------|
| app/(dashboard)/page.tsx | ~15 | Updated 4 links, changed icon, updated card content |
| components/layout/Sidebar.tsx | ~5 | Updated nav item, added path prefix matching |
| components/layout/MobileNav.tsx | ~3 | Updated nav item label and icon |
| public/sw.js | 1 | Version bump v2 → v3 |

**Total:** 4 files, ~24 lines modified

## Commit

- **Hash:** `2008474`
- **Message:** `feat(18-01): update navigation links for COP Reader mode transition`
- **Files:** app/(dashboard)/page.tsx, components/layout/Sidebar.tsx, components/layout/MobileNav.tsx, public/sw.js

## Success Criteria Met

- ✅ Planner mode card navigates to /cop (COP Reader) with BookOpen icon
- ✅ Desktop sidebar shows "COP Reader" linking to /cop with active state on /cop/* paths
- ✅ Mobile slide-out menu shows "COP Reader" linking to /cop
- ✅ Dashboard browse/empty-state links point to /cop
- ✅ Fixer mode completely unchanged
- ✅ Service worker version bumped to v3
- ✅ Build passes with no TypeScript errors

---

**Plan Status:** ✅ Complete
**Duration:** 3min 12s
**Execution Date:** 2026-02-08
