---
phase: 14-basic-cop-reader
plan: 01
subsystem: cop-reader
tags: [cop, routing, ui, server-components, json]

requires:
  - "13-02 (chapter JSON files in public/cop/)"
  - "shadcn/ui Card and Badge components"
  - "Dashboard layout with auth protection"

provides:
  - "COP chapter grid index at /cop"
  - "Chapter reader route at /cop/[chapterNumber]"
  - "TypeScript types for COP JSON structure"
  - "Loading skeletons for both routes"

affects:
  - "14-02 (will enhance with recursive section renderer and inline images)"
  - "Future COP search/navigation features"

tech-stack:
  added: []
  patterns:
    - "Server Components with fs.readFileSync for public/ JSON"
    - "Next.js 14 async params pattern"
    - "Grid layout matching planner pattern"

key-files:
  created:
    - types/cop.ts
    - app/(dashboard)/cop/page.tsx
    - app/(dashboard)/cop/loading.tsx
    - app/(dashboard)/cop/[chapterNumber]/page.tsx
    - app/(dashboard)/cop/[chapterNumber]/loading.tsx
  modified: []

key-decisions:
  - decision: "Use fs.readFileSync in Server Components instead of dynamic imports"
    rationale: "Simpler, more reliable for public/ files, avoids client bundle bloat"
    alternatives: "Dynamic imports with next/dynamic"
    date: 2026-02-08
  - decision: "Basic top-level section rendering in Plan 01, recursive in Plan 02"
    rationale: "Incremental delivery - establishes routes first, enhances rendering second"
    alternatives: "Build full recursive renderer in single plan"
    date: 2026-02-08
  - decision: "Version display as 'v25.12 — 1 December 2025' below page title"
    rationale: "Satisfies COPR-06 requirement for prominent version identifier"
    alternatives: "Badge only, separate version page"
    date: 2026-02-08

metrics:
  duration: "2min 33sec"
  completed: 2026-02-08
---

# Phase 14 Plan 01: COP Types and Reader Shell Summary

> TypeScript types for chapter JSON, chapter grid index at /cop, and chapter reader shell at /cop/[chapterNumber]

## One-Liner

Server Component COP reader routes with fs.readFileSync chapter loading, BookOpen icon grid layout, and v25.12 version display.

## Performance

**Duration:** 2min 33sec
**Tasks:** 2/2 completed
**Commits:** 2 task commits + 1 metadata commit

**Timing Breakdown:**
- Task 1 (Types + grid index): ~75 seconds
- Task 2 (Chapter reader shell): ~78 seconds

## Accomplishments

### Task 1: COP TypeScript Types and Chapter Grid Index Page
**Commit:** da5fd82

Created the COP reader foundation:
- **types/cop.ts**: TypeScript interfaces matching chapter JSON structure (CopChapter, CopSection, CopImage, CopChapterMeta)
- **app/(dashboard)/cop/page.tsx**: Server Component grid index displaying all 19 chapters
- **app/(dashboard)/cop/loading.tsx**: Loading skeleton matching grid layout

Key features:
- Version identifier "v25.12 — 1 December 2025" displayed prominently below page title (COPR-06)
- Card grid layout matches planner pattern (2 cols mobile, 3 cols desktop)
- Each chapter card shows chapter number badge, title, and section count
- BookOpen icon in primary/10 background
- fs.readFileSync loads chapter metadata server-side (extracts only chapterNumber, title, version, sectionCount - avoids loading full sections array)
- Touch targets >= 48px via Card component padding

### Task 2: Chapter Reader Page Shell with Loading Skeleton
**Commit:** de48f1e

Created the chapter reader route:
- **app/(dashboard)/cop/[chapterNumber]/page.tsx**: Server Component chapter reader
- **app/(dashboard)/cop/[chapterNumber]/loading.tsx**: Loading skeleton for chapter content

Key features:
- Dynamic route param validation (1-19 integer, notFound() for invalid)
- Async params resolution (Next.js 14 App Router pattern: `params: Promise<{ chapterNumber: string }>`)
- Back navigation link to /cop grid with ArrowLeft icon
- Chapter header with version badge and section count
- Basic content rendering: iterates top-level sections, renders number+title as h2, content with whitespace-pre-line
- Loading skeleton with 4-5 section placeholders

Plan 02 enhancement scope:
- Recursive SectionRenderer component for nested subsections
- Inline images from CopImage[] arrays
- Deep-link section scrolling with URL fragments

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | COP types and chapter grid index | da5fd82 | types/cop.ts, app/(dashboard)/cop/page.tsx, app/(dashboard)/cop/loading.tsx |
| 2 | Chapter reader shell and loading | de48f1e | app/(dashboard)/cop/[chapterNumber]/page.tsx, app/(dashboard)/cop/[chapterNumber]/loading.tsx |

## Files Created

**TypeScript Types:**
- `types/cop.ts` (36 lines) - Interfaces for COP chapter JSON structure

**COP Grid Index Route:**
- `app/(dashboard)/cop/page.tsx` (69 lines) - Server Component chapter grid with 19 chapters
- `app/(dashboard)/cop/loading.tsx` (29 lines) - Loading skeleton for grid layout

**Chapter Reader Route:**
- `app/(dashboard)/cop/[chapterNumber]/page.tsx` (77 lines) - Chapter reader Server Component
- `app/(dashboard)/cop/[chapterNumber]/loading.tsx` (53 lines) - Loading skeleton for chapter content

**Total:** 5 files created, 264 lines of code

## Files Modified

None - this plan created new route structure.

## Decisions Made

### 1. Server Components with fs.readFileSync for JSON Loading
**Context:** Chapter JSON files exist in public/cop/ directory (created in Phase 13-02)

**Decision:** Use Node.js fs.readFileSync in Server Components instead of dynamic imports or client-side fetch.

**Rationale:**
- Simpler, more reliable for public/ files
- Avoids client bundle bloat (chapters are 10-618 KB each)
- Server-side only - no client-side JavaScript for chapter data
- Direct file access is faster than HTTP fetch

**Alternative considered:** Dynamic imports with next/dynamic - more complex, still bundles JSON

**Impact:** Chapter pages load fast, zero client-side JSON payload

### 2. Incremental Rendering: Basic in Plan 01, Recursive in Plan 02
**Context:** COP sections are deeply nested (level 1-4), with subsections arrays and inline images

**Decision:** Plan 01 renders only top-level sections (basic iteration), Plan 02 builds recursive SectionRenderer component

**Rationale:**
- Establishes route structure first (users can navigate to chapters immediately)
- Isolates complexity - rendering enhancement is separate from routing
- Basic rendering is functional (displays content with preserved line breaks)
- Enables parallel testing of grid index while Plan 02 is in progress

**Alternative considered:** Build full recursive renderer in single plan - higher risk, longer delivery time

**Impact:** COP reader is functional after Plan 01, enhanced after Plan 02

### 3. Version Display Format
**Context:** COPR-06 requirement: "COP version identifier is displayed prominently"

**Decision:** Display version as "v25.12 — 1 December 2025" in subtitle below page title

**Rationale:**
- Meets requirement for prominent visibility
- Includes both version string and publication date for clarity
- Consistent with COP introduction text (mentions "1 December 2025" as update date)
- Extracted from first chapter (all 19 chapters share same version)

**Alternative considered:** Badge only, or separate version page - less visible, doesn't include date

**Impact:** Users immediately see COP version on /cop index page

## Deviations from Plan

None - plan executed exactly as written. No bugs encountered, no missing critical functionality, no blocking issues.

## Next Phase Readiness

### Blockers
None

### Concerns
None - routes are functional and ready for Plan 02 enhancement

### Prerequisites for Phase 14 Plan 02
- ✅ CopChapter, CopSection, CopImage types defined
- ✅ Chapter JSON files accessible in public/cop/ (19 files)
- ✅ Chapter reader page exists at /cop/[chapterNumber]
- ✅ Basic content rendering structure in place (can be replaced with recursive component)

### Tech Debt
None - code follows established patterns, no TODOs or hacks

### Dependencies
Phase 14 Plan 02 will:
- Read existing types/cop.ts interfaces
- Replace basic section iteration in app/(dashboard)/cop/[chapterNumber]/page.tsx with SectionRenderer component
- Add image rendering using Next.js Image component (R2 URLs already in remotePatterns)

---

**Plan Status:** ✅ Complete
**Next Plan:** 14-02 (Recursive section renderer with inline images)
**Phase Status:** 1/2 plans complete (Basic COP Reader)
