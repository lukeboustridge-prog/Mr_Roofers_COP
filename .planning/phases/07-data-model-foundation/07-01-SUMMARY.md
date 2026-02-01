---
phase: 07-data-model-foundation
plan: 01
subsystem: database
tags: [drizzle, postgresql, schema, cross-source-linking]

dependency-graph:
  requires: []
  provides: [topics, categoryTopics, detailLinks, legislativeReferences, detailLegislativeLinks]
  affects: [07-02, 07-03, phase-8, phase-10, phase-12]

tech-stack:
  added: []
  patterns: [junction-tables, authority-hierarchy, semantic-grouping]

key-files:
  created:
    - lib/db/migrations/0002_topics_and_links.sql
  modified:
    - lib/db/schema.ts

decisions:
  - decision: "superseded_by FK added via migration SQL not schema.ts"
    rationale: "Self-referential FK in Drizzle causes TypeScript circular reference error"

metrics:
  duration: "~12 minutes"
  completed: "2026-02-01"
---

# Phase 7 Plan 01: Schema Additions Summary

Added 5 new tables for cross-source linking infrastructure (DATA-01, DATA-02, DATA-03).

## What Was Done

### Task 1: Schema Definitions
Added 5 new table definitions to `lib/db/schema.ts`:

1. **topics** - Semantic grouping for unified navigation
   - Fields: id, name, description, iconUrl, sortOrder
   - Purpose: Group related categories across sources (e.g., "Flashings" topic)

2. **categoryTopics** - Junction table
   - Links categories to topics (many-to-many)
   - Cascade delete on both sides

3. **detailLinks** - Authority hierarchy for cross-source linking
   - Links primary (MRM authoritative) to supplementary (RANZ supporting) details
   - Fields: linkType ('installation_guide', 'technical_supplement', 'alternative'), matchConfidence ('exact', 'partial', 'related'), notes
   - Indexes on both foreign keys for query performance
   - CHECK constraint prevents self-links

4. **legislativeReferences** - Normalized NZBC citations
   - Fields: code, edition, amendment, clause, title, authorityLevel, sourceUrl, effectiveDate, supersededBy
   - Index on code field for lookups
   - Self-referential FK for superseded references

5. **detailLegislativeLinks** - Junction table
   - Links details to legislative references
   - Context field ('compliance', 'guidance', 'exception')

### Task 2: Database Migration
- Generated migration via `drizzle-kit generate`
- Applied schema changes via `drizzle-kit push`
- Added CHECK constraint `no_self_link` manually
- Added unique index on detail_links pair
- Added FK constraint on superseded_by column
- Verified all 5 tables exist with correct indexes

## Commits

| Hash | Message |
|------|---------|
| 89d5eb8 | feat(07-01): add schema definitions for cross-source linking infrastructure |
| 4848a35 | chore(07-01): add migration SQL for cross-source linking tables |

## Verification Results

- TypeScript: Build compiles successfully
- Database: All 5 tables created
- Indexes: idx_detail_links_primary, idx_detail_links_supplementary, idx_leg_refs_code
- Constraints: no_self_link CHECK, idx_detail_links_unique UNIQUE

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Self-referential FK TypeScript error**
- **Found during:** Task 1
- **Issue:** `supersededBy: text('superseded_by').references(() => legislativeReferences.id)` caused TypeScript circular reference error
- **Fix:** Removed inline reference, added FK constraint in migration SQL instead
- **Files modified:** lib/db/schema.ts
- **Commit:** 89d5eb8

## Files Modified

```
lib/db/schema.ts                              # +68 lines (5 new tables)
lib/db/migrations/0002_topics_and_links.sql   # +61 lines (migration)
```

## Next Plan Readiness

Phase 7 Plan 02 (Type definitions and API interfaces) can proceed:
- Schema exports available: topics, categoryTopics, detailLinks, legislativeReferences, detailLegislativeLinks
- Database tables ready for queries
- No blockers identified
