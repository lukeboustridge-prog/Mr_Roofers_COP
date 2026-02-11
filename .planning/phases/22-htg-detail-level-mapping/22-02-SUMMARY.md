---
phase: 22-htg-detail-level-mapping
plan: 02
subsystem: ui
tags: [react, nextjs, htg, detail-viewer, tabs]

# Dependency graph
requires:
  - phase: 22-01
    provides: detailHtg junction table and getHtgForDetail query
provides:
  - HtgDetailPanel component for rendering HTG guide excerpts
  - HTG Guide tab in DetailViewer (conditional, badge-count)
  - HTG content integrated into planner and fixer detail pages
affects: [all detail pages with HTG mappings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Collapsible guide sections grouped by sourceDocument
    - Sentence-boundary content truncation (~200 chars)
    - COP Reader deep-linking for full context
    - Relevance-based sorting (primary first)
    - Conditional tab rendering with badge counts

key-files:
  created:
    - components/details/HtgDetailPanel.tsx
  modified:
    - components/details/DetailViewer.tsx
    - app/(dashboard)/planner/[substrate]/[category]/[detailId]/page.tsx
    - app/(dashboard)/fixer/[detailId]/page.tsx

key-decisions:
  - "HtgDetailPanel groups pages by sourceDocument (flashings, penetrations, cladding)"
  - "Collapsible sections open by default - primary content user navigated to"
  - "Show first 3 pages per guide with 'Show N more' expand button if >5 pages"
  - "COP Reader deep-links: /cop/8 for flashings, /cop/9 for penetrations, /cop/6 for cladding"
  - "HTG Guide tab positioned after Installation but before Warnings"

patterns-established:
  - "Content truncation at sentence boundary for better readability"
  - "Relevance badges: Primary (green) and Supplementary (grey)"
  - "ArrowUpRight icon for external/deep-link navigation"
  - "Badge with count on tab trigger for content quantity indication"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 22 Plan 02: HTG Detail-Level UI Integration Summary

**HTG installation guidance now visible on detail pages via collapsible "HTG Guide" tab with COP Reader deep-links**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T06:26:49Z
- **Completed:** 2026-02-11T06:30:36Z
- **Tasks:** 2
- **Files modified:** 1 created, 3 modified

## Accomplishments
- Created HtgDetailPanel component with collapsible guide sections
- Added conditional "HTG Guide" tab to DetailViewer component
- Wired getHtgForDetail query into planner and fixer detail pages
- HTG content loads in parallel with detail and linked content
- Details with HTG mappings (F07, P10, etc.) now show relevant How-To Guide pages inline

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HtgDetailPanel component and add HTG tab to DetailViewer** - `1428731` (feat)
2. **Task 2: Wire getHtgForDetail into planner and fixer detail pages** - `2c5666a` (feat)

## Files Created/Modified
- `components/details/HtgDetailPanel.tsx` - Client component for rendering HTG guide excerpts with collapsible sections, page cards, COP Reader deep-links
- `components/details/DetailViewer.tsx` - Added htgContent prop, hasHtgContent boolean, HTG Guide tab trigger and content
- `app/(dashboard)/planner/[substrate]/[category]/[detailId]/page.tsx` - Import getHtgForDetail, add to Promise.all, pass htgContent to DetailViewer
- `app/(dashboard)/fixer/[detailId]/page.tsx` - Import getHtgForDetail, add to Promise.all, pass htgContent to DetailViewer

## Decisions Made

**HtgDetailPanel design:**
- Groups HTG pages by sourceDocument (flashings, penetrations, cladding) for clear organization
- Each group displays as a collapsible Card with guide name, BookOpen icon, and page count badge
- Collapsible sections open by default (unlike SupplementaryPanel) because this is primary content the user navigated to

**Content presentation:**
- Show first 3 pages per guide with "Show N more" button if more than 5 pages total
- Truncate content to ~200 chars at sentence boundary for readability
- Display relevance badges: Primary (green) for keyword matches, Supplementary (grey) for category matches
- Include PDF page number badge for reference

**COP Reader integration:**
- Each page card has "View in COP Reader" button with ArrowUpRight icon
- Deep-links to correct COP chapter: /cop/8 (flashings), /cop/9 (penetrations), /cop/6 (cladding)
- Provides broader context beyond the page excerpt

**Tab placement:**
- HTG Guide tab positioned after Installation but before Warnings
- Only appears when htgContent prop has items (conditional rendering)
- Badge shows HTG page count for content quantity indication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript/ESLint passed, components integrated cleanly, query wired successfully.

## User Setup Required

None - all changes are UI/data integration (no external services or configuration).

## Next Phase Readiness

- HTG content now visible on detail pages (HTG-02 satisfied)
- COP Reader deep-links provide broader context (HTG-03 satisfied)
- Roofers viewing flashing/penetration/junction details see relevant installation guidance (HTG-01 satisfied)
- Phase 23 (V3D color extraction) can proceed - no blockers

**Integration complete:**
- 39,532 HTG-to-detail mappings (from Phase 22-01) now surface on detail pages
- Flashings guide content appears on flashing details (F07, etc.)
- Penetrations guide content appears on penetration details (P10, etc.)
- Drainage details (D01, etc.) correctly show no HTG tab (no mappings)

## Self-Check: PASSED

All claimed files and commits verified:
- Created file: components/details/HtgDetailPanel.tsx ✓
- Modified files: DetailViewer.tsx, planner page.tsx, fixer page.tsx ✓
- Commits: 1428731, 2c5666a ✓

---
*Phase: 22-htg-detail-level-mapping*
*Completed: 2026-02-11*
