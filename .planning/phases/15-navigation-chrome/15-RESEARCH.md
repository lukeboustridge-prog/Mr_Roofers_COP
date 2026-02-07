# Phase 15: Navigation Chrome - Research

**Researched:** 2026-02-08
**Domain:** Navigation UX (deep-linking, breadcrumbs, TOC sidebar/drawer, scrollspy)
**Confidence:** HIGH

## Summary

Navigation chrome for hierarchical documentation requires four integrated systems: deep-linking to sections via URL hash fragments, breadcrumb trails showing the hierarchy, a table of contents sidebar/drawer, and scrollspy highlighting.

The standard approach uses Next.js Link components with hash fragments, shadcn/ui's Sheet and Sidebar components for responsive navigation, and custom Intersection Observer implementation for scrollspy. Hash fragment scrolling in Next.js 14 App Router has known issues requiring manual useEffect-based workarounds. Service worker cache versioning must increment when new routes are added to ensure offline functionality.

**Primary recommendation:** Build custom scrollspy with IntersectionObserver (don't use third-party libraries), use shadcn Sheet for mobile drawer and Sidebar for desktop TOC, implement hash scroll polyfill with useEffect, and bump service worker CACHE_VERSION when adding `/cop/[sectionNumber]` routes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| IntersectionObserver API | Native | Scrollspy tracking | Browser-native, performant, no main-thread blocking |
| Next.js Link | 14.x | Hash navigation | Built-in component, supports hash fragments natively |
| shadcn/ui Sheet | Latest | Mobile drawer | Radix Dialog-based, gesture-responsive, accessible |
| shadcn/ui Sidebar | Latest | Desktop TOC | New composable sidebar (Feb 2026), collapsible, themeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix Dialog | ^1.1.15 | Drawer primitive | Already in project, Sheet is built on this |
| usePathname | next/navigation | Route detection | Breadcrumb construction from URL |
| Zustand | ^5.0.10 | TOC state | Already in project for sidebar collapse state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom scrollspy | react-scrollspy, react-intersection-observer | Custom gives control over rootMargin config, avoids dependency |
| shadcn Sheet | Radix Dialog directly | Sheet adds gesture support and mobile optimizations |
| Hash polyfill | react-scroll library | Hash fragments are standard, library adds 23KB |

**Installation:**
```bash
# Already installed
npm install @radix-ui/react-dialog zustand

# Add shadcn components
npx shadcn@latest add sheet
npx shadcn@latest add sidebar
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/cop/
├── [chapterNumber]/
│   └── page.tsx                    # Existing chapter reader
├── [sectionNumber]/                # NEW: Deep-link route
│   └── page.tsx                    # Redirect to chapter + hash
└── layout.tsx                      # Wrap with TOC sidebar

components/cop/
├── SectionRenderer.tsx             # Existing (already has section IDs)
├── TOCSidebar.tsx                  # NEW: Desktop collapsible sidebar
├── TOCDrawer.tsx                   # NEW: Mobile slide-out drawer
├── Breadcrumbs.tsx                 # NEW: Hierarchy breadcrumb trail
├── ScrollspyProvider.tsx           # NEW: Context for active section
└── use-scrollspy.ts                # NEW: IntersectionObserver hook
```

### Pattern 1: Hash Fragment Polyfill
**What:** useEffect hook that manually scrolls to hash targets after client-side navigation
**When to use:** All routes with `#section-X.Y.Z` hash fragments
**Example:**
```typescript
// Source: Multiple community solutions verified with Next.js docs
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if hash exists in URL
    const hash = window.location.hash
    if (!hash) return

    // Remove the # and find the element
    const id = hash.replace('#', '')
    const element = document.getElementById(id)

    if (element) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    }
  }, [pathname])
}
```

### Pattern 2: Scrollspy with IntersectionObserver
**What:** Track which section is currently visible and highlight it in TOC
**When to use:** Any page with long content and a navigation sidebar
**Example:**
```typescript
// Source: MDN IntersectionObserver API + verified community patterns
'use client'

import { useEffect, useState } from 'react'

export function useScrollspy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        root: null,  // viewport
        rootMargin: '-30% 0px -70% 0px',  // Trigger when section is 30% from top
        threshold: 0  // Fire immediately when crossing boundary
      }
    )

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}
```

### Pattern 3: Breadcrumb Construction from Hierarchy
**What:** Parse section number (e.g., "8.5.4") to build breadcrumb trail
**When to use:** Any COP section page
**Example:**
```typescript
// Custom pattern for hierarchical section numbering
function buildBreadcrumbs(chapterData: CopChapter, sectionNumber: string) {
  const parts = sectionNumber.split('.')
  const breadcrumbs = [
    { label: 'COP', href: '/cop' },
    { label: `Chapter ${parts[0]}`, href: `/cop/${parts[0]}` }
  ]

  // Walk the hierarchy to build full trail
  let currentSection = chapterData.sections.find(s => s.number === parts[0])

  for (let i = 1; i < parts.length; i++) {
    const num = parts.slice(0, i + 1).join('.')
    currentSection = currentSection?.subsections?.find(s => s.number === num)
    if (currentSection) {
      breadcrumbs.push({
        label: `${num} ${currentSection.title}`,
        href: `/cop/${num}`
      })
    }
  }

  return breadcrumbs
}
```

### Pattern 4: Responsive TOC (Sidebar vs Drawer)
**What:** Desktop shows fixed sidebar, mobile shows drawer trigger
**When to use:** Documentation pages with table of contents
**Example:**
```typescript
// Source: shadcn/ui Sidebar and Sheet patterns
'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { Menu } from 'lucide-react'

export function TOCLayout({ children, tocItems }) {
  return (
    <SidebarProvider>
      {/* Desktop: Fixed sidebar */}
      <div className="hidden md:block">
        <Sidebar>
          <TOCTree items={tocItems} />
        </Sidebar>
      </div>

      {/* Mobile: Drawer */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left">
            <TOCTree items={tocItems} />
          </SheetContent>
        </Sheet>
      </div>

      <main>{children}</main>
    </SidebarProvider>
  )
}
```

### Anti-Patterns to Avoid
- **Using scroll event listeners:** IntersectionObserver is more performant (runs off main thread)
- **Third-party scrollspy libraries:** Custom implementation is simpler and has no bundle size
- **Assuming hash scroll works automatically:** Next.js 14 App Router requires manual polyfill
- **Single threshold value:** Use rootMargin instead for better control of trigger points
- **Forgetting to disconnect observer:** Memory leak on unmount
- **Not handling multiple intersecting sections:** Only highlight the topmost section

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile slide-out drawer | Custom `<aside>` with CSS transforms | shadcn Sheet component | Handles gestures, focus trap, scroll lock, ARIA attributes |
| Collapsible sidebar | useState + CSS transitions | shadcn Sidebar component | Handles persistence, animations, responsive breakpoints |
| Smooth scroll polyfill | requestAnimationFrame scroll loop | `scrollIntoView({ behavior: 'smooth' })` | Native browser support is excellent (99%+) |
| Hash change detection | Manual URL parsing | `window.location.hash` + 'hashchange' event | Browser handles URL updates automatically |

**Key insight:** Navigation chrome has deep accessibility requirements (keyboard nav, focus management, ARIA roles) that shadcn/Radix components already solve. Hash scrolling requires a polyfill for Next.js 14 App Router, but it's a simple useEffect hook, not a library.

## Common Pitfalls

### Pitfall 1: Hash Fragment Scroll Fails on Client Navigation
**What goes wrong:** User clicks `<Link href="/cop/8#section-8.5.4">` and URL changes but page doesn't scroll to the section
**Why it happens:** Next.js 14 App Router doesn't automatically scroll to hash fragments during client-side navigation (known issue #44295)
**How to avoid:** Implement hash scroll polyfill with useEffect
**Warning signs:** Hash navigation works on hard refresh but not on Link clicks
**Verification:** Test both hard navigation and client-side navigation to hash targets

### Pitfall 2: Multiple Sections Intersecting Simultaneously
**What goes wrong:** Scrollspy highlights two sections at once when scrolling between them
**Why it happens:** Both sections are "intersecting" during the scroll transition
**How to avoid:** Track all intersecting sections and highlight only the topmost one, or use aggressive rootMargin to ensure only one section intersects at a time
**Warning signs:** TOC highlights flicker between items during scroll
**Verification:** Scroll slowly through sections and verify only one highlight at a time

### Pitfall 3: Service Worker Doesn't Cache New Routes
**What goes wrong:** `/cop/8.5.4` route works online but fails offline after Phase 15
**Why it happens:** Service worker's static asset cache doesn't include the new route pattern
**How to avoid:** Bump CACHE_VERSION and add route pattern to cache
**Warning signs:** Offline mode shows "You are offline" for deep-link URLs
**Verification:** Test offline navigation to `/cop/X.Y.Z` URLs after Phase 15 deployment

### Pitfall 4: Breadcrumb Hierarchy Doesn't Match Section Nesting
**What goes wrong:** Breadcrumb shows "COP > Chapter 8 > 8.5.4" instead of "COP > Chapter 8 > 8.5 Flashing Types > 8.5.4 Change of Pitch"
**Why it happens:** Breadcrumb builder only looks at top-level sections, doesn't walk subsection tree
**How to avoid:** Recursively traverse subsections to build full hierarchy
**Warning signs:** Breadcrumbs skip intermediate levels (e.g., 8.5)
**Verification:** Test deep sections (3+ levels) and verify all intermediate levels appear

### Pitfall 5: IntersectionObserver Not Disconnected on Unmount
**What goes wrong:** Memory leak, especially noticeable when navigating between chapters
**Why it happens:** useEffect doesn't return cleanup function to disconnect observer
**How to avoid:** Always return `() => observer.disconnect()` from useEffect
**Warning signs:** Performance degradation after multiple chapter navigations
**Verification:** Check browser DevTools Memory profiler for lingering observers

### Pitfall 6: TOC Sidebar Doesn't Scroll to Active Item
**What goes wrong:** Active section highlight is outside the visible TOC viewport
**Why it happens:** TOC container doesn't scroll to keep active item visible
**How to avoid:** Add `scrollIntoView()` for active TOC item when it changes
**Warning signs:** Active highlight "disappears" as user scrolls through long chapters
**Verification:** Scroll to bottom of long chapter, verify TOC scrolls to show active item

## Code Examples

Verified patterns from official sources:

### Deep-Link Route Handler
```typescript
// app/(dashboard)/cop/[sectionNumber]/page.tsx
// Handles URLs like /cop/8.5.4 and redirects to chapter page with hash

import { redirect, notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import type { CopChapter } from '@/types/cop'

interface SectionPageProps {
  params: Promise<{ sectionNumber: string }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionNumber } = await params

  // Parse section number (e.g., "8.5.4" -> chapter 8)
  const parts = sectionNumber.split('.')
  const chapterNumber = parseInt(parts[0], 10)

  if (isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > 19) {
    notFound()
  }

  // Verify section exists in chapter data
  const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${chapterNumber}.json`)

  if (!fs.existsSync(chapterPath)) {
    notFound()
  }

  const chapterData: CopChapter = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'))

  // Verify section exists by walking hierarchy
  const sectionExists = findSection(chapterData.sections, sectionNumber)

  if (!sectionExists) {
    notFound()
  }

  // Redirect to chapter page with hash fragment
  redirect(`/cop/${chapterNumber}#section-${sectionNumber}`)
}

function findSection(sections: CopSection[], targetNumber: string): boolean {
  for (const section of sections) {
    if (section.number === targetNumber) return true
    if (section.subsections) {
      if (findSection(section.subsections, targetNumber)) return true
    }
  }
  return false
}
```

### Scrollspy Hook with TypeScript
```typescript
// components/cop/use-scrollspy.ts
// Source: MDN IntersectionObserver API + verified patterns

'use client'

import { useEffect, useState, useRef } from 'react'

interface UseScrollspyOptions {
  rootMargin?: string
  threshold?: number | number[]
}

export function useScrollspy(
  sectionIds: string[],
  options: UseScrollspyOptions = {}
) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const { rootMargin = '-30% 0px -70% 0px', threshold = 0 } = options

    // Track all currently intersecting sections
    const intersectingSections = new Set<string>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingSections.add(entry.target.id)
          } else {
            intersectingSections.delete(entry.target.id)
          }
        })

        // Highlight the topmost intersecting section
        if (intersectingSections.size > 0) {
          // Find topmost by DOM order
          const topmost = sectionIds.find(id => intersectingSections.has(id))
          if (topmost) setActiveId(topmost)
        }
      },
      { root: null, rootMargin, threshold }
    )

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observerRef.current?.observe(element)
    })

    // Cleanup
    return () => {
      observerRef.current?.disconnect()
      intersectingSections.clear()
    }
  }, [sectionIds, options])

  return activeId
}
```

### TOC Tree Component
```typescript
// components/cop/TOCTree.tsx
// Recursive TOC rendering with active highlighting

'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CopSection } from '@/types/cop'

interface TOCTreeProps {
  sections: CopSection[]
  chapterNumber: number
  activeId: string
  level?: number
}

export function TOCTree({ sections, chapterNumber, activeId, level = 0 }: TOCTreeProps) {
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Scroll active item into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [activeId])

  return (
    <ul className={cn('space-y-1', level > 0 && 'ml-4 mt-1')}>
      {sections.map((section) => {
        const isActive = activeId === `section-${section.number}`

        return (
          <li key={section.number}>
            <Link
              ref={isActive ? activeRef : null}
              href={`/cop/${chapterNumber}#section-${section.number}`}
              className={cn(
                'block py-1 px-2 rounded text-sm hover:bg-slate-100',
                isActive && 'bg-slate-200 font-semibold text-slate-900',
                !isActive && 'text-slate-600'
              )}
            >
              <span className="text-slate-400 mr-2">{section.number}</span>
              {section.title}
            </Link>

            {section.subsections && section.subsections.length > 0 && (
              <TOCTree
                sections={section.subsections}
                chapterNumber={chapterNumber}
                activeId={activeId}
                level={level + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
```

### Hash Scroll Polyfill Hook
```typescript
// components/cop/use-hash-scroll.ts
// Manual hash scrolling for Next.js 14 App Router
// Source: Community solutions verified with Next.js behavior

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash
      if (!hash) return

      const id = hash.replace('#', '')
      const element = document.getElementById(id)

      if (element) {
        // Delay to ensure DOM is fully rendered
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)
      }
    }

    // Scroll on mount (handles direct navigation)
    handleHashScroll()

    // Listen for hash changes (handles same-page navigation)
    window.addEventListener('hashchange', handleHashScroll)

    return () => {
      window.removeEventListener('hashchange', handleHashScroll)
    }
  }, [pathname])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scroll event listeners | IntersectionObserver API | March 2019 (browser support) | 99%+ browser support, runs off main thread |
| react-scrollspy library | Custom IntersectionObserver hook | 2024-2026 shift | No dependency, smaller bundle, more control |
| Radix Dialog for drawer | shadcn Sheet component | Feb 2024 (shadcn) | Better mobile gestures, scroll lock out of box |
| Custom sidebar component | shadcn Sidebar component | Feb 2026 (new release) | Composable, themeable, persistence built in |
| Hash scrolling "just works" | Manual useEffect polyfill | Next.js 13+ App Router | Known issue, no native fix planned |

**Deprecated/outdated:**
- **react-scrollspy:** Still maintained but unnecessary with native IntersectionObserver
- **react-scroll:** Heavy dependency (23KB) for functionality that's native in browsers
- **Radix Navigation Menu for TOC:** Overkill; designed for website navigation, not document outlines
- **Window scroll position tracking:** Use IntersectionObserver instead for performance

## Open Questions

Things that couldn't be fully resolved:

1. **Will Next.js fix hash scrolling in App Router?**
   - What we know: Issue #44295 is open, marked for routing roadmap
   - What's unclear: Timeline for native fix
   - Recommendation: Implement polyfill now, can remove later if native support lands

2. **Should deep-link routes cache chapter data or redirect?**
   - What we know: Redirect is simpler, avoids data duplication
   - What's unclear: Performance impact of redirect vs direct render
   - Recommendation: Use redirect initially, measure performance, optimize if needed

3. **How to handle TOC state persistence across navigations?**
   - What we know: Zustand can store collapsed state
   - What's unclear: Should state persist per-chapter or globally?
   - Recommendation: Store globally in localStorage, users expect sidebar state to persist

4. **Should scrollspy update URL hash as user scrolls?**
   - What we know: Some documentation sites do this (e.g., MDN)
   - What's unclear: Does this help or hurt UX? Impact on browser history?
   - Recommendation: Start without URL updates, gather feedback in usability testing

## Sources

### Primary (HIGH confidence)
- [Next.js Linking and Navigating (Official Docs)](https://nextjs.org/docs/14/app/building-your-application/routing/linking-and-navigating) - Hash fragment behavior
- [MDN IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Configuration options
- [shadcn/ui Drawer Component](https://ui.shadcn.com/docs/components/radix/drawer) - Mobile drawer implementation
- [shadcn/ui Sidebar Component](https://ui.shadcn.com/docs/components/radix/sidebar) - Desktop sidebar implementation
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/sheet) - Slide-out sheet pattern

### Secondary (MEDIUM confidence)
- [GitHub Issue #44295: Next.js 13 Link not scrolling to anchor](https://github.com/vercel/next.js/issues/44295) - Known hash scroll bug
- [GitHub Discussion #82649: Scroll to Fragment Hash deleted](https://github.com/vercel/next.js/discussions/82649) - Hash behavior clarification
- [CSS-Tricks: Table of Contents with IntersectionObserver](https://css-tricks.com/table-of-contents-with-intersectionobserver/) - Scrollspy pattern
- [Handling Hashes in React/Next.js Applications (Medium)](https://medium.com/@dodanieloluwadare/handling-hashes-in-react-next-js-applications-21aac1ed9a1b) - useHash hook pattern
- [Service Worker Lifecycle Explained (Zeepalm)](https://www.zeepalm.com/blog/service-worker-lifecycle-explained-update-version-control) - Cache versioning strategy
- [PWA Offline Functionality: Caching Strategies (Zeepalm)](https://www.zeepalm.com/blog/pwa-offline-functionality-caching-strategies-checklist) - Cache invalidation

### Tertiary (LOW confidence)
- [Creating a Dynamic Breadcrumb Component in Next.js (Medium)](https://medium.com/@kcabading/creating-a-breadcrumb-component-in-a-next-js-app-router-a0ea24cdb91a) - Breadcrumb pattern (unverified)
- [react-intersection-observer vs alternatives (npm-compare)](https://npm-compare.com/react-intersection-observer,react-scroll,react-scrollspy,react-waypoint) - Library comparison (outdated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - shadcn/ui components are proven, IntersectionObserver is native browser API
- Architecture: HIGH - Patterns verified with official Next.js docs and MDN
- Pitfalls: HIGH - Hash scroll issue confirmed in GitHub issues, IntersectionObserver pitfalls from MDN
- Service worker: MEDIUM - Pattern is correct but project-specific cache strategy needs verification

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable ecosystem)

---

## Key Findings for Planner

1. **Hash scrolling requires a polyfill** - Next.js 14 App Router doesn't auto-scroll to hash fragments on client navigation (Issue #44295). Simple useEffect solution exists.

2. **Don't use third-party scrollspy libraries** - Custom IntersectionObserver hook is simpler, more performant, and avoids dependencies. Configuration: `rootMargin: '-30% 0px -70% 0px'` for optimal UX.

3. **shadcn components solve mobile vs desktop** - Use Sheet for mobile drawer (gesture-responsive) and Sidebar for desktop (collapsible, themeable). Both already compatible with Radix Dialog in project.

4. **Service worker cache must be versioned** - Bump `CACHE_VERSION` from `v1` to `v2` when adding `/cop/[sectionNumber]` routes. Add pattern to `STATIC_ASSETS`.

5. **Breadcrumbs require hierarchy traversal** - Section numbers like "8.5.4" need recursive subsection lookup to build "COP > Chapter 8 > 8.5 Flashing Types > 8.5.4 Change of Pitch" breadcrumb trail.

6. **Deep-link route should redirect** - `/cop/8.5.4` -> redirect to `/cop/8#section-8.5.4`. Simpler than duplicating chapter data, works with existing SectionRenderer IDs.
