---
phase: 07-data-model-foundation
plan: 03
subsystem: database
tags: [drizzle, queries, nzbc, citations, topics, links]

# Dependency graph
requires:
  - phase: 07-01
    provides: Schema tables for topics, categoryTopics, detailLinks, legislativeReferences
provides:
  - Topic query functions for unified navigation
  - Detail link queries for cross-source content
  - NZBC citation formatting utility
  - Central query export module
affects: [09-unified-navigation, 10-detail-page-enhancement, 11-search-enhancement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bidirectional link queries (supplements/supplementsTo)"
    - "Topic-based category aggregation with raw SQL"
    - "Type-safe query interfaces for Drizzle joins"

key-files:
  created:
    - lib/db/queries/topics.ts
    - lib/db/queries/detail-links.ts
    - lib/db/queries/index.ts
    - lib/utils/legislative-format.ts
  modified: []

key-decisions:
  - "Raw SQL for topic aggregation (complex GROUP BY with counts)"
  - "Bidirectional link model: supplements and supplementsTo arrays"
  - "Type aliasing for Drizzle result casting"

patterns-established:
  - "Query files in lib/db/queries/ with central index export"
  - "Utility files in lib/utils/ for domain-specific formatting"
  - "NZBC citation formatting via formatNZBCCitation()"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 7 Plan 3: Query Functions Summary

**Type-safe query functions for topic-based navigation and cross-source detail linking with NZBC citation formatting**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T01:06:53Z
- **Completed:** 2026-02-01T01:10:29Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments
- getDetailsByTopic enables unified navigation across MRM and RANZ sources
- getDetailWithLinks returns bidirectional content relationships
- formatNZBCCitation produces correct NZBC-compliant citations
- Central query export for clean imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create topic query functions** - `df8cacf` (feat)
2. **Task 2: Create detail links query functions** - `e607902` (feat)
3. **Task 3: Create NZBC citation formatting and query index** - `a44f96f` (feat)

## Files Created

- `lib/db/queries/topics.ts` - Topic queries: getTopicsWithCounts, getDetailsByTopic, getTopicById
- `lib/db/queries/detail-links.ts` - Link queries: getDetailWithLinks, createDetailLink, getLinksForDetail, deleteDetailLink
- `lib/db/queries/index.ts` - Central export for all query functions and types
- `lib/utils/legislative-format.ts` - NZBC citation utilities: formatNZBCCitation, inferAuthorityLevel, parseCitation

## Query Function Details

### topics.ts
```typescript
getTopicsWithCounts(): Promise<TopicWithCounts[]>
// Returns topics with categoryCount and detailCount

getDetailsByTopic(topicId, options): Promise<TopicDetailsResult>
// Unified navigation: "show all flashings from all sources"
// Options: sourceId filter, limit, offset, orderBy

getTopicById(topicId): Promise<Topic | null>
```

### detail-links.ts
```typescript
getDetailWithLinks(detailId): Promise<DetailWithLinks | null>
// Returns detail with supplements (links TO) and supplementsTo (links FROM)

createDetailLink(primary, supplementary, linkType, confidence, notes)
// Link MRM authoritative content to RANZ supporting content

getLinksForDetail(detailId)
// All links in both directions

deleteDetailLink(linkId)
```

### legislative-format.ts
```typescript
formatNZBCCitation({ code: 'E2/AS1', edition: '4th', clause: 'Table 20' })
// => "E2/AS1 (4th edition) Table 20"

inferAuthorityLevel('E2/AS1')
// => 'acceptable_solution'
```

## Decisions Made
- Used raw SQL for topic aggregation due to complex GROUP BY with multiple counts across joins
- Bidirectional link model chosen over single-direction to support both "show related RANZ guides" and "show MRM source for this guide"
- Type casting through `unknown` for Drizzle raw SQL results

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all TypeScript compilation passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Query functions ready for Phase 9 (Unified Navigation) to consume
- Detail link queries ready for Phase 10 (Detail Page Enhancement)
- Citation formatting ready for legislative reference display
- All functions exported via lib/db/queries/index.ts

---
*Phase: 07-data-model-foundation*
*Completed: 2026-02-01*
