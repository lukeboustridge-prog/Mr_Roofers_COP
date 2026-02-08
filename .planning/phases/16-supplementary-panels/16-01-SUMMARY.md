---
phase: 16-supplementary-panels
plan: 01
subsystem: ui
tags: [react, collapsible, radix-ui, drizzle-orm, database-query]

# Dependency graph
requires:
  - phase: 13-cop-reader
    provides: CopSection and CopChapter types, chapter JSON files, cop_sections database table
  - phase: 14-cop-content
    provides: SectionRenderer component for recursive section rendering
  - phase: 15-navigation-chrome
    provides: ChapterContent client component wrapping section content
provides:
  - SupplementaryPanel collapsible UI component (grey border, collapsed by default)
  - SupplementaryDetailCard component for rendering linked detail cards
  - getSupplementaryContent database query (fetches all detail + HTG links for a chapter)
  - Full data pipeline: page.tsx -> ChapterContent -> SectionRenderer -> SupplementaryPanel
  - SupplementaryData, SupplementaryDetail, SupplementaryHtg types in types/cop.ts
affects: [17-detail-links, 18-semantic-search]

# Tech tracking
tech-stack:
  added: [@radix-ui/react-collapsible (via shadcn/ui collapsible)]
  patterns: [Server Component database query with Map serialization for client boundary, conditional supplementary panel rendering]

key-files:
  created:
    - components/ui/collapsible.tsx
    - components/cop/SupplementaryPanel.tsx
    - components/cop/SupplementaryDetailCard.tsx
    - lib/db/queries/supplementary.ts
  modified:
    - types/cop.ts
    - app/(dashboard)/cop/[chapterNumber]/page.tsx
    - components/cop/ChapterContent.tsx
    - components/cop/SectionRenderer.tsx

key-decisions:
  - "Use Collapsible (NOT Accordion) for independent panel state per section"
  - "Serialize Map to Record via Object.fromEntries() to cross Server/Client boundary"
  - "Two separate queries (details + HTG) grouped by section ID in-memory (no N+1)"
  - "Collapsed by default (SUPP-01) to avoid visual clutter in reading flow"
  - "SupplementaryPanel wraps content in existing SupplementaryContent component for consistent grey border styling"

patterns-established:
  - "Server Component query + Map serialization pattern for passing lookup data to client components"
  - "Conditional panel rendering in SectionRenderer via IIFE to keep JSX clean"
  - "Recursive prop passthrough (supplementaryContent) through subsection tree"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 16 Plan 01: Supplementary Panels Summary

**Collapsible supplementary panels with detail cards and HTG guides, queried from cop_section_details and cop_section_htg tables, conditionally rendered inline within COP sections**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T10:11:57Z
- **Completed:** 2026-02-08T10:17:48Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- Installed shadcn/ui Collapsible component (Radix primitive)
- Created SupplementaryPanel and SupplementaryDetailCard UI components with grey border styling
- Created getSupplementaryContent database query fetching detail links + HTG links for a chapter
- Wired full data pipeline from Server Component through to SectionRenderer conditional rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Collapsible and create panel components** - `3ec225a` (feat)
   - Installed @radix-ui/react-collapsible via shadcn/ui
   - Added SupplementaryData, SupplementaryDetail, SupplementaryHtg types to types/cop.ts
   - Created SupplementaryPanel: collapsible grey-bordered container with "Supplementary" label, collapsed by default
   - Created SupplementaryDetailCard: compact card with code badge, name, description (2-line clamp), 3D indicator, source badge

2. **Task 2: Wire supplementary data from database through to SectionRenderer** - `6029116` (feat)
   - Created lib/db/queries/supplementary.ts: getSupplementaryContent query with two DB queries (details + HTG), grouped by section ID
   - Modified page.tsx: call getSupplementaryContent, serialize Map to Record via Object.fromEntries, pass to ChapterContent
   - Modified ChapterContent: accept supplementaryContent prop, pass to SectionRenderer
   - Modified SectionRenderer: render SupplementaryPanel when linked data exists for section, pass through to recursive subsections

## Files Created/Modified

**Created:**
- `components/ui/collapsible.tsx` - Radix Collapsible primitive wrappers (shadcn/ui install)
- `components/cop/SupplementaryPanel.tsx` - Collapsible panel with grey border, "Supplementary" label, ChevronDown icon
- `components/cop/SupplementaryDetailCard.tsx` - Detail card with code badge, name, description, 3D model indicator, source badge, link to /detail/{id}
- `lib/db/queries/supplementary.ts` - getSupplementaryContent query function (2 queries: detail links + HTG links)

**Modified:**
- `types/cop.ts` - Added SupplementaryData, SupplementaryDetail, SupplementaryHtg interfaces
- `app/(dashboard)/cop/[chapterNumber]/page.tsx` - Import getSupplementaryContent, call it, serialize Map, pass to ChapterContent
- `components/cop/ChapterContent.tsx` - Accept supplementaryContent prop, pass to SectionRenderer
- `components/cop/SectionRenderer.tsx` - Conditionally render SupplementaryPanel for details and HTG guides when data exists, pass through to subsections

## Decisions Made

1. **Collapsible vs Accordion:** Used Collapsible (NOT Accordion) because each section's supplementary panel has independent state. Accordion would force only one panel open at a time across the entire chapter, which is wrong for this use case.

2. **Map serialization:** Map cannot cross Server/Client boundary. Serialized via `Object.fromEntries(map)` to produce `Record<string, SupplementaryData>` that client components can consume.

3. **Two separate queries:** Queried cop_section_details and cop_section_htg separately (both joined through copSections for chapterNumber filtering), then grouped results by section ID in-memory. This avoids N+1 queries (one per section) and is efficient even with thousands of links.

4. **Collapsed by default:** SupplementaryPanel has `defaultOpen={false}` per SUPP-01 requirement. This avoids visual clutter in the reading flow. Users expand panels when they want to see linked content.

5. **Grey border styling:** SupplementaryPanel wraps children in the existing `SupplementaryContent` component (`border-l-4 border-slate-300 bg-slate-50`) for consistent visual distinction from authoritative MRM content.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing linting errors:** Build revealed pre-existing linting errors in `CopImage.tsx` (unused `cn` import) and `lib/db/link-cop-section-details.ts` (unused imports, `any` types). These are unrelated to this plan and were not fixed to keep scope focused.

**Empty tables gracefully handled:** The cop_section_details and cop_section_htg tables are currently empty (zero rows). The query returns an empty Map, no panels are rendered, and the UI shows no errors. This confirms the graceful empty state handling works as designed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 17 (Detail Linking):**
- UI infrastructure for displaying supplementary content is complete
- Database query pattern established for fetching linked content
- SupplementaryDetailCard links to `/detail/{id}` pages (already exist from Phase 5-6)
- Phase 17 can populate cop_section_details table with semantic links

**Ready for Phase 18 (Semantic Search):**
- SupplementaryData structure supports HTG guides
- cop_section_htg table is queried and rendered
- Phase 18 can populate cop_section_htg with PDF-extracted HTG content

**Zero visual regression:**
- COP reader pages load without errors when tables are empty
- No empty panel containers rendered (conditional rendering works correctly)
- Existing COP navigation (TOC, breadcrumbs, scrollspy) unaffected

**Performance:**
- Only 2 database queries per chapter page load (detail links + HTG links)
- No N+1 queries even with hundreds of sections per chapter
- Map grouping happens in Node.js memory (fast)

**Blockers:**
None - implementation complete and verified.

---
*Phase: 16-supplementary-panels*
*Completed: 2026-02-08*
