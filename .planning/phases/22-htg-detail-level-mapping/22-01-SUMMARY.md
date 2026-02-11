---
phase: 22-htg-detail-level-mapping
plan: 01
subsystem: database
tags: [drizzle-orm, junction-table, htg, mapping, keyword-matching]

# Dependency graph
requires:
  - phase: 17-htg-content-pipeline
    provides: htgContent table with 350 HTG pages extracted from PDFs
provides:
  - detailHtg junction table linking HTG content to specific detail codes
  - getHtgForDetail(detailId) query function returning relevant HTG pages
  - Keyword-based mapping script with 39,532 detail-to-HTG mappings
affects: [23-v3d-color-extraction, future detail page enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Keyword-based content mapping with multi-signal approach (name tokens + keyword groups)
    - Junction table with relevance and matchType metadata
    - Batch insert pattern (50 records per batch) for large data populations

key-files:
  created:
    - lib/db/map-htg-to-details.ts
    - lib/db/queries/htg-detail.ts
  modified:
    - lib/db/schema.ts
    - package.json

key-decisions:
  - "detailHtg junction table uses composite primary key (detailId, htgId) with separate indexes on each column"
  - "Keyword matching: tokenize detail names (length > 3) + predefined keyword groups (ridge, valley, barge, etc.)"
  - "All 39,532 mappings are keyword-based (primary relevance) - no category-only fallback needed due to comprehensive keyword matches"
  - "Batch size of 50 records balances insert performance with transaction overhead"

patterns-established:
  - "Multi-signal mapping: keyword groups + detail name tokenization for robust matching"
  - "Relevance levels: 'primary' for keyword matches, 'supplementary' for category-only (though none generated in this phase)"
  - "matchType tracking: 'keyword' | 'category' | 'manual' for future curation support"

# Metrics
duration: 30min
completed: 2026-02-11
---

# Phase 22 Plan 01: HTG Detail-Level Mapping Summary

**39,532 HTG-to-detail mappings created via keyword matching, enabling detail pages to display relevant How-To Guide content**

## Performance

- **Duration:** 30 min
- **Started:** 2026-02-11T05:51:01Z
- **Completed:** 2026-02-11T06:20:52Z
- **Tasks:** 2
- **Files modified:** 3 created, 2 modified

## Accomplishments
- Created detailHtg junction table with detailId, htgId, relevance, matchType, notes columns
- Implemented keyword-based mapping script with --suggest and --insert modes
- Generated 39,532 mappings: 8,256 flashings, 16,459 penetrations, 14,817 cladding (all keyword-based)
- Built getHtgForDetail query function returning HTG content sorted by relevance
- Pushed schema to database and populated all mappings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create detailHtg junction table and mapping script** - `762cde3` (feat)
2. **Task 2: Create getHtgForDetail query and populate mappings** - `68509ec` (feat)

## Files Created/Modified
- `lib/db/schema.ts` - Added detailHtg table with composite PK and indexes
- `lib/db/map-htg-to-details.ts` - CLI script for keyword-based HTG-to-detail mapping with --suggest/--insert modes
- `lib/db/queries/htg-detail.ts` - getHtgForDetail(detailId) query function
- `package.json` - Added db:map-htg-to-details npm script

## Decisions Made

**Keyword matching strategy:**
- Tokenized detail names (filtered to words > 3 chars) plus predefined keyword groups (ridge, valley, barge, apron, etc.)
- Scan HTG content and guide names for both tokenized detail name and keyword group matches
- Mark keyword matches as 'primary' relevance (HTG specifically discusses this detail type)

**No category-only mappings needed:**
- Original plan included category-level fallback (e.g., all flashings HTG → all flashings details)
- Keyword matching was comprehensive enough that all 39,532 mappings are keyword-based
- No 'supplementary' category-only mappings were generated

**Batch insert optimization:**
- Used 50 records per batch (plan specified this size)
- Completed 39,532 inserts in ~60 seconds during --insert run

## Deviations from Plan

None - plan executed exactly as written. The keyword matching strategy proved more effective than anticipated, eliminating the need for category-only fallback mappings.

## Issues Encountered

None - script ran successfully, schema pushed cleanly, and query function verified with test cases.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- detailHtg table populated and indexed
- getHtgForDetail query function ready for integration into detail pages
- Mapping can be re-run idempotently via `npm run db:map-htg-to-details -- --insert`
- Phase 23 (V3D color extraction) can proceed - no blockers

**Note for future work:**
- All current mappings are automatic (keyword-based). The matchType='manual' option exists for future expert curation if needed.
- Consider adding a manual curation interface to refine mappings if precision issues are discovered in production use.

## Self-Check: PASSED

All claimed files and commits verified:
- Created files: lib/db/map-htg-to-details.ts, lib/db/queries/htg-detail.ts ✓
- Commits: 762cde3, 68509ec ✓

---
*Phase: 22-htg-detail-level-mapping*
*Completed: 2026-02-11*
