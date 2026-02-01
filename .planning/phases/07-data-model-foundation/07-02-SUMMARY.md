---
phase: 07-data-model-foundation
plan: 02
subsystem: database
tags: [topics, seeding, category-mapping, drizzle]

dependency-graph:
  requires: [07-01]
  provides: [topics-seeded, category-topic-mappings, substrate-verification]
  affects: [phase-9, phase-11]

tech-stack:
  added: []
  patterns: [seed-data-definitions, idempotent-seeding]

key-files:
  created:
    - lib/db/seed-data/topics.ts
    - scripts/seed-topics.ts
  modified: []

decisions:
  - decision: "Added drainage and cladding topics beyond original 5"
    rationale: "Database has drainage category (MRM) and cladding categories (RANZ) not in original plan"
  - decision: "Used actual category IDs from database (lrm-*, ranz-*) not assumed IDs"
    rationale: "Plan assumed different category naming convention; updated to match reality"

metrics:
  duration: "~8 minutes"
  completed: "2026-02-01"
---

# Phase 7 Plan 02: Topic Seeding Summary

Seeded 6 topics and mapped all 10 categories for unified navigation across sources (DATA-02). Verified all 6 substrates exist (DATA-04).

## What Was Done

### Task 1: Topic Seed Data Definitions

Created `lib/db/seed-data/topics.ts` with:

**6 Semantic Topics:**
| Topic | Description |
|-------|-------------|
| flashings | Ridge, valley, barge, apron, and other flashing details |
| penetrations | Pipe, vent, and other roof penetration details |
| junctions | Wall, gutter, and other junction details |
| ventilation | Roof space and underlay ventilation details |
| drainage | Gutter, downpipe, and roof drainage details |
| cladding | Roof cladding installation and fixing details |

**10 Category-Topic Mappings:**
| Category ID | Topic | Source |
|-------------|-------|--------|
| lrm-flashings | flashings | MRM COP |
| lrm-penetrations | penetrations | MRM COP |
| lrm-junctions | junctions | MRM COP |
| lrm-ventilation | ventilation | MRM COP |
| lrm-drainage | drainage | MRM COP |
| ranz-flashings | flashings | RANZ |
| ranz-penetrations-corrugated | penetrations | RANZ |
| ranz-penetrations-rib | penetrations | RANZ |
| ranz-cladding-horizontal | cladding | RANZ |
| ranz-cladding-vertical | cladding | RANZ |

### Task 2: Seeding Script

Created `scripts/seed-topics.ts` with:
- Idempotent seeding using `onConflictDoNothing()`
- Substrate verification (DATA-04)
- Detailed logging of created/skipped items
- Verification summary with category counts per topic

### Task 3: Database Verification

**Final Database State:**
| Metric | Count |
|--------|-------|
| Topics | 6 |
| Categories | 10 |
| Category-Topic mappings | 10 |
| Substrates | 6 |
| Details | 312 |

**Topics with Category Distribution:**
| Topic | MRM COP | RANZ |
|-------|---------|------|
| Flashings | 1 | 1 |
| Penetrations | 1 | 2 |
| Junctions | 1 | 0 |
| Ventilation | 1 | 0 |
| Drainage | 1 | 0 |
| Cladding | 0 | 2 |

**All categories mapped:** No unmapped categories remain.

## Commits

| Hash | Message |
|------|---------|
| 5c39449 | feat(07-02): add topic seeding infrastructure |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added drainage and cladding topics**
- **Found during:** Task 1
- **Issue:** Plan assumed 5 topics (flashings, penetrations, junctions, ventilation, general) but database has drainage (MRM) and cladding (RANZ) categories
- **Fix:** Added drainage and cladding topics, removed general (no existing categories use it)
- **Files modified:** lib/db/seed-data/topics.ts

**2. [Rule 1 - Bug] Fixed db.execute template literal issue**
- **Found during:** Task 2
- **Issue:** Drizzle ORM's `db.execute` with template literals fails with "query.getSQL is not a function"
- **Fix:** Used raw neon client for complex verification queries
- **Files modified:** scripts/seed-topics.ts

## Data Quality Observations

### Current State
- All 10 categories mapped to 6 topics
- All 6 substrates verified to exist
- 312 details across all categories

### Gaps for Future Phases
- **Junctions topic:** Only MRM has junction category (1 MRM, 0 RANZ)
- **Ventilation topic:** Only MRM has ventilation category (1 MRM, 0 RANZ)
- **Drainage topic:** Only MRM has drainage category (1 MRM, 0 RANZ)
- **Cladding topic:** Only RANZ has cladding categories (0 MRM, 2 RANZ)

These gaps are expected based on source content and do not require action.

## Files Created

```
lib/db/seed-data/topics.ts        # Topic definitions and mappings
scripts/seed-topics.ts            # Idempotent seeding script
```

## Next Plan Readiness

Phase 7 Plan 03 (Admin UI for linking) can proceed:
- Topics available for unified navigation queries
- Category-topic mappings enable cross-source queries
- All substrates verified
- No blockers identified
