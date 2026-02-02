---
phase: 12-content-linking-population
plan: 01
subsystem: api
tags: [string-similarity, drizzle, clerk, admin-api, content-linking]

# Dependency graph
requires:
  - phase: 07-data-model-foundation
    provides: detail_links table with primaryDetailId, supplementaryDetailId, linkType, matchConfidence
  - phase: 10-detail-page-enhancement
    provides: getDetailWithLinks query, createDetailLink function
provides:
  - CLI script for auto-suggesting MRM-RANZ links based on code similarity
  - Admin API for link CRUD operations (list, create, read, update, delete)
  - Suggestions API endpoint for on-demand link generation
  - Three-tier confidence classification (exact, partial, related)
affects:
  - 12-02 (admin UI for link management)
  - 12-03 (link population execution)

# Tech tracking
tech-stack:
  added: [string-similarity]
  patterns: [code-normalization, name-similarity-matching, confidence-classification]

key-files:
  created:
    - scripts/suggest-detail-links.ts
    - app/api/admin/links/route.ts
    - app/api/admin/links/[id]/route.ts
    - app/api/admin/links/suggestions/route.ts
  modified:
    - lib/db/queries/detail-links.ts
    - package.json

key-decisions:
  - "Strip RANZ- prefix before code comparison for normalized matching"
  - "Use name similarity (>=0.6) as fallback when codes differ"
  - "Three confidence tiers: exact (1.0), partial (>=0.7), related (>=0.5 or name match)"
  - "Default installation_guide linkType for auto-suggested links"

patterns-established:
  - "Code normalization: strip RANZ-/MRM- prefix, uppercase for comparison"
  - "Prefix family matching: V codes match V codes, F codes match F codes"
  - "Admin API pattern: isAdmin() helper + force-dynamic for Clerk auth"

# Metrics
duration: 18min
completed: 2026-02-02
---

# Phase 12 Plan 01: Link Suggestion Script and Admin API Summary

**Auto-suggestion script using string-similarity with three-tier confidence classification (exact/partial/related), plus full admin CRUD API for MRM-RANZ link management**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-02T04:23:38Z
- **Completed:** 2026-02-02T04:41:00Z
- **Tasks:** 2
- **Files modified:** 5 (1 modified, 4 created)

## Accomplishments
- Created CLI script that generates 274 link suggestions (26 exact, 248 related) from 251 MRM and 61 RANZ details
- Code normalization strips RANZ- prefix enabling exact matches like F07 to RANZ-F07
- Admin API with full CRUD: list all links, create with validation, get/update/delete by ID
- On-demand suggestions endpoint excludes existing links and supports minConfidence filter

## Task Commits

Each task was committed atomically:

1. **Task 1: Install string-similarity and create auto-suggestion script** - `3d41efe` (feat)
2. **Task 2: Create admin link CRUD API routes** - `7d16557` (feat)

## Files Created/Modified

### Created
- `scripts/suggest-detail-links.ts` - CLI script with --dry-run and --apply flags, generates suggestions comparing MRM/RANZ codes
- `app/api/admin/links/route.ts` - GET (list all) and POST (create) endpoints with zod validation
- `app/api/admin/links/[id]/route.ts` - GET, PATCH, DELETE for single link operations
- `app/api/admin/links/suggestions/route.ts` - On-demand suggestion generation with minConfidence filter

### Modified
- `lib/db/queries/detail-links.ts` - Added getDetailLinkById, getAllLinks with joined detail info, updateDetailLink
- `package.json` - Added string-similarity and @types/string-similarity

## Decisions Made

1. **RANZ- prefix normalization** - MRM codes like "F07" and RANZ codes like "RANZ-F07" are the same conceptually; strip prefix before comparison to enable exact matching
2. **Three-tier confidence classification** - exact (codes match after normalizing), partial (same family >=0.7), related (name similarity >=0.6 or same family >=0.5)
3. **Name similarity as fallback** - When codes differ but names are similar (e.g., "Ridge End" to "Ridge to Gable End"), classify as related
4. **Default linkType for auto-suggestions** - Use "installation_guide" as default; admin can change via API if needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial script found 0 suggestions because raw code comparison (V20 vs RANZ-V03) had low similarity. Fixed by implementing code normalization (strip RANZ- prefix) and adding name-based matching as secondary strategy.
- Admin API routes return 404 HTML when not authenticated (Clerk middleware protection). This is expected behavior - verified by confirming public API routes work and lint passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Suggestion script ready for admin review and link population
- API endpoints ready for admin UI integration
- 274 suggestions available (26 exact matches are high-confidence candidates)
- Admin UI (12-02) can now be built against these endpoints

---
*Phase: 12-content-linking-population*
*Completed: 2026-02-02*
