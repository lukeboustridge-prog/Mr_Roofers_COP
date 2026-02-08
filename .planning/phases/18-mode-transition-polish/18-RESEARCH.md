# Phase 18: Mode Transition and Polish - Research

**Researched:** 2026-02-08
**Domain:** Next.js navigation patterns, PWA route updates, dual-mode UI transitions
**Confidence:** HIGH

## Summary

This research investigates how to transition Planner mode navigation from substrate-first (`/planner/*`) to chapter-first COP Reader (`/cop/*`) while preserving Fixer mode functionality unchanged. The current implementation uses Zustand state management for mode tracking, links in navigation components for route changes, and a service worker v2 for offline caching.

The standard approach is to update route references in navigation components (dashboard cards, sidebar, mobile nav) to point Planner mode at `/cop` instead of `/planner`, while leaving all existing routes intact for backward compatibility and Fixer mode operation. Service worker already caches `/cop` routes as of v2, requiring no cache strategy changes.

**Primary recommendation:** Modify navigation link destinations without changing underlying routes or mode logic. Update dashboard page.tsx, Sidebar.tsx, MobileNav.tsx to link Planner mode to `/cop` instead of `/planner`. Add E2E tests for both modes.

## Standard Stack

The established libraries/tools for Next.js navigation and PWA updates:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 14.2.35 | Routing and navigation | File-system based routing with Server/Client Components |
| Zustand | 5.0.10 | State management | Lightweight, persisted store for mode tracking |
| @clerk/nextjs | 6.12.0 | Authentication | Layout-level auth with middleware integration |
| Vanilla Service Worker | ES2020 | PWA offline caching | Direct control over cache strategies, no Workbox needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation | (built-in) | useRouter, usePathname hooks | Client-side navigation and path detection |
| @playwright/test | 1.58.0 | E2E testing | Verify navigation flows across modes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct links | next/navigation Router.push() | Links are simpler, better for SEO, standard pattern |
| Workbox | Vanilla SW | Current codebase already has working vanilla SW, no migration needed |
| Middleware redirect | Component-level links | Links preserve history, middleware would be transparent but overkill |

**Installation:**
```bash
# All dependencies already installed
# No new packages needed for this phase
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   ├── page.tsx           # Dashboard with mode cards
│   ├── planner/           # Substrate-first navigation (preserved)
│   ├── cop/               # Chapter-first COP Reader (becomes Planner target)
│   └── fixer/             # Task-first navigation (unchanged)
components/
├── layout/
│   ├── Header.tsx         # Contains ModeToggle
│   ├── Sidebar.tsx        # Desktop navigation
│   └── MobileNav.tsx      # Mobile bottom nav
stores/
└── app-store.ts           # Mode state persisted to localStorage
```

### Pattern 1: Navigation Link Swapping
**What:** Change destination URLs in navigation components without touching mode state logic
**When to use:** When UI paths change but underlying functionality remains the same
**Example:**
```typescript
// Before (current state)
<Link href="/planner">
  <Card onClick={() => setMode('planner')}>
    Planner Mode
  </Card>
</Link>

// After (Phase 18)
<Link href="/cop">
  <Card onClick={() => setMode('planner')}>
    Planner Mode
  </Card>
</Link>
```
**Source:** Current codebase at `/app/(dashboard)/page.tsx` lines 103-133

### Pattern 2: Preserve Legacy Routes for Backward Compatibility
**What:** Keep existing `/planner/*` routes functional even after navigation changes
**When to use:** When routes may be bookmarked, shared, or referenced externally
**Example:**
```typescript
// /app/(dashboard)/planner/page.tsx remains unchanged
// Links now point to /cop but /planner still works if accessed directly
// No breaking changes to existing functionality
```
**Rationale:** Users may have bookmarks, recent history links, or external references to `/planner` routes. Removing them would break existing workflows.

### Pattern 3: Service Worker Cache Version Update
**What:** Increment CACHE_VERSION constant when route priorities change
**When to use:** When new routes become primary navigation paths
**Example:**
```javascript
// public/sw.js
const CACHE_VERSION = 'v3'; // Increment from v2
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/cop',        // Already present in v2
  '/cop/1',      // Already cached by file extension .json pattern
  '/fixer',      // Unchanged
  // /planner preserved but lower priority
];
```
**Source:** Current service worker at `public/sw.js` lines 1-20

### Pattern 4: Mode State Independence from Routes
**What:** Mode state (`planner` | `fixer`) is UI preference, not tied to specific routes
**When to use:** Always — separates concerns between navigation and user preferences
**Example:**
```typescript
// stores/app-store.ts (unchanged)
mode: 'planner',  // User preference persisted to localStorage
setMode: (mode) => set({ mode }),

// Navigation can point anywhere while mode tracks UI state
// Mode toggle in header remains functional
```
**Source:** Current store at `stores/app-store.ts` lines 21-24, 73-74

### Anti-Patterns to Avoid
- **Removing `/planner` routes entirely:** Breaks bookmarks and history links
- **Coupling mode state to specific routes:** Makes future navigation changes brittle
- **Service worker route removal:** Old cached pages would 404, breaks offline experience
- **Conditional routing based on mode:** Adds complexity, prefer declarative link destinations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route-based mode detection | Custom URL parsing logic | Zustand persisted state | Mode is UI preference, not derived from URL |
| Navigation component abstraction | Generic `<NavLink mode="planner">` wrapper | Direct `<Link href="/cop">` | Simpler, clearer, standard Next.js pattern |
| Service worker cache invalidation | Custom cache key logic | CACHE_VERSION increment | Standard SW pattern, browser handles cleanup |
| Redirect middleware for `/planner` → `/cop` | Middleware.ts redirect logic | Keep both routes live | Preserves backward compatibility |

**Key insight:** Next.js already provides robust routing and navigation primitives. Changing where links point is simpler and more maintainable than adding abstraction layers or redirect logic.

## Common Pitfalls

### Pitfall 1: Breaking Existing Bookmarks
**What goes wrong:** User has `/planner/long-run-metal/flashings` bookmarked, after phase ships they get 404
**Why it happens:** Removing routes to "clean up" after navigation change
**How to avoid:** Keep all existing `/planner/*`, `/fixer/*`, `/cop/*` routes functional. Only change link destinations.
**Warning signs:**
- Playwright tests failing for direct URL navigation
- 404s in production logs after deployment
- User feedback about broken links

### Pitfall 2: Mode State Drift
**What goes wrong:** User clicks "Planner" mode toggle, state updates but they're still on `/fixer` page
**Why it happens:** Mode toggle sets state but doesn't navigate
**How to avoid:** Mode toggle is UI indicator only. Navigation happens via explicit links. Document this separation clearly.
**Warning signs:**
- User confusion about "what mode am I in?"
- Bug reports about mode toggle not working
- Mode state not matching current page

### Pitfall 3: Service Worker Stale Caching
**What goes wrong:** User's browser caches old navigation that still points to `/planner`, sees old UI after deployment
**Why it happens:** Service worker serves cached HTML pages with old link destinations
**How to avoid:**
1. Increment CACHE_VERSION to v3
2. Test cache clearing on version upgrade
3. Verify skipWaiting() and clients.claim() are active (already present in current SW)
**Warning signs:**
- Users report seeing old navigation after update
- Cache version shows v2 in browser DevTools
- Update banner doesn't appear

### Pitfall 4: Incomplete Link Updates
**What goes wrong:** Dashboard cards point to `/cop` but sidebar still links to `/planner`, inconsistent UX
**Why it happens:** Forgetting to update all navigation surfaces (desktop sidebar, mobile nav, breadcrumbs)
**How to avoid:**
- Audit all files importing/rendering planner links
- Search codebase for `href="/planner"` and update systematically
- E2E tests for all navigation surfaces
**Warning signs:**
- Inconsistent navigation across mobile/desktop
- Some UI points to old routes
- Grep shows remaining `/planner` in navigation components

### Pitfall 5: Fixer Mode Regression
**What goes wrong:** Changes to shared components accidentally break Fixer mode navigation
**Why it happens:** Shared Header, Sidebar, MobileNav used by both modes
**How to avoid:**
1. Fixer mode links should remain unchanged (`/fixer`, `/fixer/results`)
2. Test Fixer mode explicitly after Planner navigation changes
3. No conditional logic based on mode in shared components
**Warning signs:**
- Fixer mode E2E tests failing
- Fixer page links pointing to wrong destinations
- Mode-specific conditional rendering appearing in shared layouts

## Code Examples

Verified patterns from official sources:

### Dashboard Mode Cards Update
```typescript
// app/(dashboard)/page.tsx
// Current (lines 103-133)
<Link href="/planner">
  <Card onClick={() => setMode('planner')}>
    <CardTitle>Planner Mode</CardTitle>
    <CardDescription>Office & Desktop Planning</CardDescription>
  </Card>
</Link>

// Phase 18 Change
<Link href="/cop">
  <Card onClick={() => setMode('planner')}>
    <CardTitle>Planner Mode</CardTitle>
    <CardDescription>Browse COP by Chapter</CardDescription>
  </Card>
</Link>

// Fixer card unchanged
<Link href="/fixer">
  <Card onClick={() => setMode('fixer')}>
    <CardTitle>Fixer Mode</CardTitle>
    <CardDescription>On-Site Quick Lookup</CardDescription>
  </Card>
</Link>
```
**Source:** Current implementation at `app/(dashboard)/page.tsx`

### Sidebar Navigation Update
```typescript
// components/layout/Sidebar.tsx
// Current mainNavItems (lines 22-28)
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/planner', label: 'Planner', icon: Clipboard },  // Change this
  { href: '/fixer', label: 'Fixer', icon: Wrench },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Favourites', icon: Star },
];

// Phase 18 Change
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cop', label: 'COP Reader', icon: BookOpen },  // New destination
  { href: '/fixer', label: 'Fixer', icon: Wrench },       // Unchanged
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Favourites', icon: Star },
];
```
**Source:** Current implementation at `components/layout/Sidebar.tsx`, lines 22-28

### Mobile Navigation Update
```typescript
// components/layout/MobileNav.tsx
// Current mainNavItems (lines 84-90)
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/planner', label: 'Planner Mode', icon: Clipboard, highlight: mode === 'planner' },
  { href: '/fixer', label: 'Fixer Mode', icon: Wrench, highlight: mode === 'fixer' },
  // ...
];

// Phase 18 Change
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cop', label: 'COP Reader', icon: BookOpen, highlight: mode === 'planner' },
  { href: '/fixer', label: 'Fixer Mode', icon: Wrench, highlight: mode === 'fixer' },
  // ...
];
```
**Source:** Current implementation at `components/layout/MobileNav.tsx`, lines 84-90

### Service Worker Version Update
```javascript
// public/sw.js
// Current (line 2)
const CACHE_VERSION = 'v2';

// Phase 18 Change
const CACHE_VERSION = 'v3';  // Increment to clear old navigation caches

// STATIC_ASSETS already includes /cop (line 17)
const STATIC_ASSETS = [
  '/',
  '/planner',   // Keep for backward compatibility
  '/fixer',     // Unchanged
  '/search',
  '/favourites',
  '/checklists',
  '/settings',
  '/cop',       // Already present
  '/manifest.json',
  '/offline.html',
];
```
**Source:** Current service worker at `public/sw.js`, verified `/cop` already cached at line 17

### E2E Test Pattern
```typescript
// tests/navigation.spec.ts
test.describe('Phase 18: Mode Transition', () => {
  test('Planner mode navigates to COP Reader from dashboard', async ({ page }) => {
    await page.goto('/');

    // Click Planner mode card
    await page.getByRole('link', { name: /planner mode/i }).click();

    // Should navigate to COP Reader
    await expect(page).toHaveURL('/cop');
    await expect(page.getByRole('heading', { name: /code of practice/i })).toBeVisible();
  });

  test('Legacy /planner route still works', async ({ page }) => {
    // Direct navigation to old route
    await page.goto('/planner');

    // Should show substrate grid
    await expect(page.getByRole('heading', { name: /planner mode/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /long run metal/i })).toBeVisible();
  });

  test('Fixer mode unchanged', async ({ page }) => {
    await page.goto('/');

    // Click Fixer mode card
    await page.getByRole('link', { name: /fixer mode/i }).click();

    // Should navigate to Fixer (unchanged)
    await expect(page).toHaveURL('/fixer');
    await expect(page.getByRole('heading', { name: /fixer mode/i })).toBeVisible();
  });
});
```
**Source:** Adapted from existing patterns in `tests/navigation.spec.ts`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Substrate-first Planner | Chapter-first COP Reader | Phase 18 (v1.2) | Primary navigation mirrors PDF structure |
| Service Worker v1 | Service Worker v2 with /cop caching | Phase 15 (v1.2) | Offline COP reading already supported |
| Mode-based routing | Mode as UI state, links as navigation | v1.0 baseline | Separates concerns, flexible navigation |
| Hard-coded nav links | Hard-coded nav links | Unchanged | Simple, explicit, standard Next.js pattern |

**Deprecated/outdated:**
- Nothing deprecated — this is navigation refinement, not replacement
- All existing patterns remain valid
- Service worker v1 already upgraded to v2 in Phase 15

## Open Questions

Things that couldn't be fully resolved:

1. **Should /planner route show deprecation notice?**
   - What we know: Route will remain functional for backward compatibility
   - What's unclear: Whether to add UI banner saying "COP Reader is now the primary Planner view"
   - Recommendation: No banner in Phase 18 — keep it simple. User can navigate both ways. Consider user feedback post-launch.

2. **Should Topics navigation be added to main nav?**
   - What we know: `/topics` exists as alternative navigation path (semantic topics across sources)
   - What's unclear: Whether Topics should join COP Reader, Fixer in primary navigation
   - Recommendation: Defer to user feedback. Current dashboard shows topics prominently. Adding to nav may clutter.

3. **Mobile navigation icon choice for COP Reader**
   - What we know: Desktop sidebar will use BookOpen icon for COP Reader
   - What's unclear: Mobile bottom nav has limited space (4 items currently), adding COP Reader makes 5
   - Recommendation: Keep mobile nav focused on Home, Search, Fixer, Saved. COP Reader accessed via Home dashboard or Menu sheet.

## Sources

### Primary (HIGH confidence)
- Current codebase files:
  - `app/(dashboard)/page.tsx` (dashboard mode cards)
  - `app/(dashboard)/planner/page.tsx` (substrate-first navigation)
  - `app/(dashboard)/cop/page.tsx` (chapter-first COP Reader)
  - `app/(dashboard)/fixer/page.tsx` (task-first navigation)
  - `components/layout/Sidebar.tsx` (desktop navigation)
  - `components/layout/MobileNav.tsx` (mobile navigation)
  - `components/layout/ModeToggle.tsx` (mode state toggle)
  - `stores/app-store.ts` (Zustand mode state management)
  - `public/sw.js` (service worker v2 with /cop caching)
  - `tests/navigation.spec.ts` (existing E2E navigation tests)
  - `.planning/ROADMAP.md` (Phase 18 requirements)
  - `.planning/REQUIREMENTS.md` (MODE-01, MODE-02)
  - `.planning/STATE.md` (current implementation status)

### Secondary (MEDIUM confidence)
- [Next.js App Router Redirecting Guide](https://nextjs.org/docs/app/guides/redirecting)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [PWA Caching Strategies (web.dev)](https://web.dev/learn/pwa/caching)
- [Service Worker Lifecycle (Zeepalm)](https://www.zeepalm.com/blog/service-worker-lifecycle-explained-update-version-control)

### Tertiary (LOW confidence)
- None — research primarily based on existing codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in use, no new dependencies
- Architecture: HIGH — Current patterns verified in codebase, changes are link destinations only
- Pitfalls: HIGH — Based on real-world Next.js PWA patterns and existing test coverage

**Research date:** 2026-02-08
**Valid until:** 60 days (stable tech stack, no fast-moving dependencies)

---

## Implementation Checklist

Quick reference for planning:

- [ ] Update dashboard page.tsx Planner card link `/planner` → `/cop`
- [ ] Update Sidebar.tsx mainNavItems `/planner` → `/cop`
- [ ] Update MobileNav.tsx mainNavItems `/planner` → `/cop`
- [ ] Increment service worker CACHE_VERSION 'v2' → 'v3'
- [ ] Add E2E test: Planner mode navigates to /cop
- [ ] Add E2E test: Legacy /planner route still works
- [ ] Add E2E test: Fixer mode unchanged
- [ ] Verify all 19 COP chapters load correctly offline
- [ ] Test mode toggle state persistence across navigation
- [ ] Verify breadcrumbs work correctly in COP Reader
- [ ] Test mobile drawer navigation on small viewports
- [ ] Verify service worker update triggers cache refresh
