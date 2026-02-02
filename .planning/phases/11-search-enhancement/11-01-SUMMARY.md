---
phase: 11-search-enhancement
plan: 01
subsystem: api
tags: [postgresql, full-text-search, ts_rank, gin-index, drizzle, source-weighting]

# Dependency graph
requires:
  - phase: 07-data-model
    provides: contentSources table with MRM/RANZ sources
  - phase: 07-data-model
    provides: details table with sourceId column
provides:
  - PostgreSQL full-text search with search_vector tsvector column
  - GIN index for fast full-text queries
  - Source-weighted search (MRM 2x boost, RANZ 1x)
  - Consent mode filtering (MRM only when true)
  - Query type detection (section/code/text routing)
affects: [12-content-linking, search-ui, consent-mode-ui]

# Tech tracking
tech-stack:
  added: [postgresql-tsvector, postgresql-gin-index, websearch_to_tsquery]
  patterns: [source-relevance-multipliers, query-type-detection, ts_rank-scoring]

key-files:
  created:
    - lib/db/migrations/0004_search_vector.sql
    - lib/search-helpers.ts
  modified:
    - lib/db/schema.ts
    - lib/validations.ts
    - app/api/search/route.ts

key-decisions:
  - "MRM authoritative content gets 2x relevance boost in search rankings"
  - "Use websearch_to_tsquery for safe natural language query handling"
  - "Section number detection returns redirect URL (not search results)"
  - "Consent mode forces sourceId='mrm-cop' filter for building consent compliance"
  - "Search weights: name (A), description (B), specifications (C)"

patterns-established:
  - "Source weighting pattern: ts_rank * CASE WHEN source_id = 'mrm-cop' THEN 2.0 ELSE 1.0 END"
  - "Query type detection before search execution (section/code/text)"
  - "Generated tsvector columns with GIN index for full-text search"
  - "Drizzle raw SQL for PostgreSQL-specific features (ts_rank, tsvector)"

# Metrics
duration: 11min
completed: 2026-02-02
---

# Phase 11 Plan 01: Search Enhancement Summary

**PostgreSQL full-text search with ts_rank and 2x MRM authority weighting using generated tsvector column and GIN index**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-02T03:31:43Z
- **Completed:** 2026-02-02T03:42:16Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Generated search_vector tsvector column with weighted fields (name A, description B, specifications C)
- GIN index on search_vector for fast full-text queries (idx_details_search_vector)
- Source-weighted ts_rank scoring: MRM authoritative content boosted 2x over RANZ supplementary content
- Consent mode API parameter filters to MRM only (building consent compliance)
- Query type detection routes section numbers to navigation, codes to exact match, text to full-text search

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration for search_vector column with GIN index** - `6f57fac` (feat)
2. **Task 2: Create search helper utilities** - `b261f58` (feat)
3. **Task 3: Enhance search API with ts_rank and source weighting** - `d9ad847` (feat)

## Files Created/Modified
- `lib/db/migrations/0004_search_vector.sql` - Generated tsvector column with weighted fields and GIN index
- `lib/db/migrations/meta/_journal.json` - Migration journal entry (idx: 3)
- `lib/db/schema.ts` - Added searchVector column to details table (read-only)
- `lib/search-helpers.ts` - Query type detection, section navigation, source relevance multipliers
- `lib/validations.ts` - Added source and consentMode parameters to searchQuerySchema
- `app/api/search/route.ts` - Implemented ts_rank with source weighting, section detection, consent mode filtering

## Decisions Made
- **MRM 2x boost:** Authoritative MRM content receives 2.0 multiplier in ts_rank scoring, RANZ supplementary content gets 1.0 (implements SEARCH-01 requirement)
- **websearch_to_tsquery:** Used instead of plainto_tsquery for safer handling of natural language queries with operators
- **Section number redirect:** Section queries (e.g., "4.3.2") return redirect URL instead of search results (SEARCH-04 foundation)
- **Consent mode filter:** When consentMode=true, API filters to sourceId='mrm-cop' only (SEARCH-03 requirement for building consent compliance)
- **Weight hierarchy:** name (A highest), description (B), specifications (C lowest) matches human search priority

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **TypeScript linting:** Initial implementation used `any[]` for WHERE conditions arrays - refactored to explicit condition arrays with proper typing to satisfy linter
- **Drizzle `and()` undefined handling:** `and()` can return undefined - fixed by building condition arrays and using spread operator instead of chained `and()` calls

Both resolved during Task 3 implementation without requiring plan changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full-text search infrastructure complete and production-ready
- Search API accepts source and consentMode parameters for Phase 11-02 (UI integration)
- Query type detection enables Phase 11-03 (section navigation) when section numbers are populated
- Source weighting provides foundation for Phase 12 (content linking) relevance scoring
- All must-have truths verified:
  - ✅ MRM content appears higher in results than equivalent RANZ content (2x multiplier)
  - ✅ Search query 'valley flashing' returns relevant results ordered by weighted relevance
  - ✅ API accepts consentMode parameter and filters to MRM only when true

**Ready for 11-02:** Search UI integration with source filters and consent mode toggle

---
*Phase: 11-search-enhancement*
*Completed: 2026-02-02*
