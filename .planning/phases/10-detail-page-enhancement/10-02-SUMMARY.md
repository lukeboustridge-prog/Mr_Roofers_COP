---
phase: 10-detail-page-enhancement
plan: 02
subsystem: ui
tags: [react, typescript, next.js, tailwind, composition, conditional-rendering]

# Dependency graph
requires:
  - phase: 10-01
    provides: ImageGallery, ImageLightbox, and RelatedContentTab components
  - phase: 07-data-model-foundation
    provides: detailLinks table and getDetailWithLinks query
  - phase: 08-visual-authority-system
    provides: SourceBadge and SourceAttribution components

provides:
  - Enhanced DetailViewer with linked content composition (3D models, steps)
  - Conditional tab rendering (Images, Installation, Warnings, Related)
  - Source attribution when content borrowed from linked guides
  - Authority-aware styling for borrowed content

affects: [10-03, Phase 11 (search), Phase 12 (content linking)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content composition with fallback (prefer own, fallback to linked)"
    - "Conditional tab rendering with boolean flags"
    - "Attribution display for borrowed content"
    - "Derived display values pattern"

key-files:
  created: []
  modified:
    - components/details/DetailViewer.tsx

key-decisions:
  - "SourceAttribution component doesn't have 'note' prop - use wrapper div with separate text"
  - "Conditional tabs filter at render time (not state-based)"
  - "Both tasks committed together as cohesive enhancement"

patterns-established:
  - "Derived display pattern: calculate display values from own + linked content before render"
  - "Boolean flags for tab visibility (hasImages, hasLinkedContent)"
  - "Attribution wrapper pattern: bordered div with SourceAttribution + explanatory text"

# Metrics
duration: 15min
completed: 2026-02-02
---

# Phase 10 Plan 02: DetailViewer Enhanced with Linked Content Integration

**DetailViewer now composes MRM specs with RANZ 3D models and installation steps, conditional tabs show only available content, and source attribution clarifies borrowed content**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-02T01:09:00Z
- **Completed:** 2026-02-02T01:24:28Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- DetailViewer displays linked RANZ 3D models and steps on MRM detail pages with clear attribution
- Conditional tab rendering eliminates empty tabs (Images, Installation, Warnings, Related)
- SourceAttribution components show when content is borrowed from linked guides
- ImageGallery and RelatedContentTab components integrated into tab structure
- Tab badges display accurate counts for all content types

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Update DetailViewer props and implement conditional tabs** - `dfcb4f1` (feat)

**Note:** Both tasks committed together as they form a cohesive enhancement. Task 1 extended types and Task 2 implemented the UI based on those types.

## Files Created/Modified

- `components/details/DetailViewer.tsx` - Enhanced with:
  - Extended `DetailWithRelations` interface with `images`, `supplements`, `supplementsTo` arrays
  - Derived display values: `display3DModelUrl`, `displaySteps`, `is3DModelBorrowed`, `areStepsBorrowed`
  - Boolean flags: `hasImages`, `hasLinkedContent`
  - Conditional tab triggers (only render tabs when content exists)
  - Images tab with ImageGallery wrapped in ContentWrapper
  - Installation tab with SourceAttribution when steps borrowed
  - Related tab with RelatedContentTab for bidirectional links
  - SourceAttribution wrapper divs for borrowed 3D models and steps

## Decisions Made

**1. SourceAttribution wrapper pattern**
- SourceAttribution component has `name` prop (not `note`)
- Used wrapper div with border/background + SourceAttribution + explanatory text paragraph
- Provides clear visual separation for borrowed content

**2. Conditional tabs at render time**
- Tabs filtered by wrapping TabsTrigger and TabsContent with boolean conditions
- No state-based filtering needed - React re-renders naturally when data changes
- Simpler than building tabs array and filtering

**3. Both tasks in single commit**
- Task 1 (types) and Task 2 (UI) are tightly coupled
- Committing together maintains atomic cohesion (types + implementation)
- Both verified together with single TypeScript compilation check

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. SourceAttribution prop mismatch**
- **Issue:** Initial implementation used `note` prop which doesn't exist on SourceAttribution
- **Solution:** Checked SourceAttribution interface, used `name` prop with wrapper div pattern
- **Impact:** Minimal - discovered during TypeScript compilation, fixed before commit

**2. LinkType type mismatch**
- **Issue:** Interface used `string` for `linkType` but RelatedContentTab expects specific union type
- **Solution:** Updated interface to use `'installation_guide' | 'technical_supplement' | 'alternative'`
- **Impact:** Ensures type safety for linked content

## Next Phase Readiness

**Ready for Phase 10 Plan 03:**
- DetailViewer fully enhanced with linked content integration
- All conditional tab patterns established
- Attribution display working correctly

**Future enhancements (not in Phase 10):**
- Multiple linked guides ranking/selection (currently shows first with model/steps)
- Inline editing of detail links (admin feature)
- Link confidence score display (data exists but not shown in UI)

---
*Phase: 10-detail-page-enhancement*
*Completed: 2026-02-02*
